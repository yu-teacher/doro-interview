---
slug: "dbd-22"
topic: "db-design"
tier: TRICKY
difficulty: 3
title: "ADD COLUMN ... DEFAULT는 항상 빠른가요? 어떤 ALTER TABLE이 테이블 전체를 재작성하나요?"
keywords: ["non-volatile DEFAULT는 메타데이터만", "volatile DEFAULT 재작성", "타입 변경 재작성", "이진 호환 예외", "재작성 중 ACCESS EXCLUSIVE"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-altertable.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html"]
concepts: [online-schema-change]
importance: 1
---
**모범 답변 (30~60초)**
PostgreSQL 16에서 non-volatile DEFAULT를 단 ADD COLUMN은 기본값이 메타데이터에 저장되어 기존 행을 다시 쓰지 않으므로 큰 테이블에서도 거의 즉시 끝납니다. 하지만 random()처럼 volatile한 DEFAULT를 쓰거나 컬럼 타입을 바꾸면 테이블과 인덱스 전체를 재작성하고, 그동안 ACCESS EXCLUSIVE 락이 유지됩니다. 타입 변경은 USING이 내용을 바꾸지 않고 이진 호환일 때만 예외입니다. 이번 실험에서는 text를 varchar(100)으로 바꿀 때는 재작성이 일어났고 varchar(100)을 varchar(200)으로 늘릴 때는 일어나지 않았습니다. 큰 테이블의 타입 변경은 새 컬럼을 추가해 나눠서 채운 뒤 교체하는 식으로 계획합니다.

```sql
ALTER TABLE big ADD COLUMN c int NOT NULL DEFAULT 0;                 -- 재작성 없음
ALTER TABLE big ADD COLUMN d double precision NOT NULL DEFAULT random(); -- 재작성
SELECT relfilenode FROM pg_class WHERE relname = 'big';              -- 바뀌면 재작성
```

(공식 문서) sql-altertable 페이지는 non-volatile DEFAULT인 ADD COLUMN은 기본값을 메타데이터에 저장하므로 재작성이 필요 없고, volatile DEFAULT나 컬럼 타입 변경은 테이블과 인덱스 전체 재작성이 필요하다고 한다. 단 USING이 내용을 바꾸지 않고 이전 타입이 새 타입으로 이진 호환이면 재작성이 필요 없고, 새 인덱스가 기존과 논리적으로 같다고 시스템이 확인하지 못하면 인덱스는 다시 만든다고 한다. CHECK나 NOT NULL 추가는 스캔은 필요하지만 재작성은 필요 없다고 하고, 재작성 형태의 ALTER TABLE은 MVCC-safe하지 않다고 한다. MySQL 8.4 innodb-online-ddl-operations 페이지는 컬럼 추가에 INSTANT가 기본 알고리즘이라고 한다.
(실험 확인) PostgreSQL 16.15에서 30만 행 테이블의 `relfilenode`는 상수 DEFAULT 컬럼 추가 후 그대로였고(약 0.5ms), `random()` DEFAULT 추가(약 137ms), `int`에서 `bigint`(약 116ms), `text`에서 `varchar(100)`(약 128ms), `varchar(200)`에서 `varchar(50)`으로 줄이기(약 128ms)에서는 바뀌었다. `varchar(100)`에서 `varchar(200)`은 바뀌지 않았다(약 0.5ms). 이미 값이 들어 있는 컬럼의 `SET NOT NULL`은 재작성 없이 스캔만 했다(약 11ms). 시간은 이 데이터량과 환경에서 나온 값이다. MySQL 8.4.11에서도 `ADD COLUMN ... DEFAULT 0, ALGORITHM=INSTANT`가 성공했다.
(보충) 새 컬럼을 추가해 나눠서 채운 뒤 교체하는 절차는 일반적인 마이그레이션 패턴이다.
