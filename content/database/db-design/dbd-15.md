---
slug: "dbd-15"
topic: "db-design"
tier: DEEP
difficulty: 3
title: "운영 중인 큰 테이블에 ALTER TABLE을 할 때 락은 어떻게 걸리고, 위험을 어떻게 줄이나요?"
keywords: ["ACCESS EXCLUSIVE 락 기본", "lock_timeout", "NOT VALID 후 VALIDATE", "락 수준이 SHARE UPDATE EXCLUSIVE로 낮아짐", "MySQL 온라인 DDL"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-altertable.html", "https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/runtime-config-client.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 ALTER TABLE은 문서에 따로 적힌 경우가 아니면 ACCESS EXCLUSIVE 락을 잡아 읽기와 쓰기를 모두 막습니다. 큰 테이블에서는 락을 기다리는 시간과 락을 쥐고 있는 시간이 모두 위험이어서, DDL 세션에 lock_timeout을 걸어 못 얻으면 포기하고 재시도합니다. 제약을 추가할 때는 NOT VALID로 먼저 추가해 전체 스캔을 건너뛰고, 나중에 VALIDATE CONSTRAINT로 검증하면 락 수준이 SHARE UPDATE EXCLUSIVE로 낮아져 쓰기를 막지 않습니다. MySQL 8.4(InnoDB)에서는 컬럼 추가가 기본 INSTANT 알고리즘이지만 변경 종류에 따라 INPLACE, COPY로 달라집니다.

```sql
SET lock_timeout = '3s';
ALTER TABLE big ADD CONSTRAINT a_pos CHECK (a > 0) NOT VALID;  -- 스캔 없이 추가
ALTER TABLE big VALIDATE CONSTRAINT a_pos;                      -- 쓰기를 막지 않고 검증
```

(공식 문서) sql-altertable 페이지는 별도 언급이 없으면 ACCESS EXCLUSIVE 락을 잡고, 여러 하위 명령이 있으면 가장 강한 락이 적용된다고 한다. `ADD table_constraint`는 보통 테이블 스캔과 락이 필요하지만 `NOT VALID`를 쓰면 스캔을 건너뛰고, `VALIDATE CONSTRAINT`는 SHARE UPDATE EXCLUSIVE 락만 필요하다고 한다. runtime-config-client 페이지는 `lock_timeout`이 락을 기다리는 동안에만 작동하며 postgresql.conf에 전역으로 두는 것은 권장하지 않는다고 한다. MySQL 8.4 innodb-online-ddl-operations 페이지는 컬럼 추가에서 INSTANT가 기본 알고리즘이라고 하고, VARCHAR 길이를 늘릴 때 길이 바이트 수가 같아야만 INPLACE가 가능하다고 한다.
(실험 확인) PostgreSQL 16.15에서 30만 행 테이블에 `VALIDATE CONSTRAINT` 중 보유한 락은 `ShareUpdateExclusiveLock`이었고, 같은 CHECK를 바로 `ADD CONSTRAINT`하면 `AccessExclusiveLock`이었다. `ADD CONSTRAINT ... NOT VALID` 자체도 `AccessExclusiveLock`이었다(스캔을 건너뛰어 짧게 끝날 뿐 락 수준이 낮은 것은 아니다). MySQL 8.4.11에서 `ADD COLUMN ... DEFAULT 0, ALGORITHM=INSTANT`와 인덱스 추가(`INPLACE, LOCK=NONE`)는 성공했다. `INT`를 `BIGINT`로 바꾸는 것은 INSTANT와 INPLACE 모두 오류 1846으로 거절(INPLACE는 "Cannot change column type INPLACE. Try ALGORITHM=COPY")되었고, `VARCHAR(30)`을 `(300)`으로 늘리는 INPLACE도 오류 1846으로 거절되었지만(문서가 말하는 길이 바이트 수 변화 때문으로 보이며, 오류 메시지가 그 이유를 직접 말하지는 않았다) `(60)`으로 늘리는 INPLACE는 성공했다.
(보충) 마이그레이션을 작은 단계로 나눠 적용하고 롤백 계획을 두라는 것은 일반적인 운영 지침이다.
