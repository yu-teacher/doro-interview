---
slug: "dbd-03"
topic: "db-design"
tier: BASIC
difficulty: 2
title: "기본키로 UUID와 bigint identity 중 무엇을 고르나요? 크기와 인덱스 면에서 어떤 차이가 있나요?"
keywords: ["UUID 16바이트", "bigint 8바이트", "무작위 UUID는 삽입 위치가 흩어짐", "분산 환경 유일성", "InnoDB 클러스터드 인덱스"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/datatype-uuid.html", "https://www.postgresql.org/docs/16/functions-uuid.html", "https://www.postgresql.org/docs/current/functions-uuid.html", "https://www.postgresql.org/docs/16/sql-cluster.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html", "https://dev.mysql.com/doc/refman/8.4/en/miscellaneous-functions.html"]
concepts: [schema-design, index-structure]
importance: 2
links: [{to: "dbi-15", kind: RELATED}, {to: "jpa-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
bigint identity는 8바이트에 값이 증가해서 인덱스가 작고 삽입이 한쪽 끝으로 몰리는 반면, PostgreSQL의 gen_random_uuid()가 만드는 v4 UUID는 16바이트에 무작위라 인덱스 곳곳으로 흩어져 들어갑니다. 대신 UUID는 시퀀스 같은 중앙 발급 없이 여러 노드나 클라이언트에서 겹치지 않게 만들 수 있습니다. 한 DB가 번호를 발급하는 일반 서비스라면 bigint가 기본이고, 분산 생성이 필요하거나 외부에 순번을 숨기고 싶을 때 UUID를 고려합니다. MySQL 8.4(InnoDB)에서는 기본키가 곧 클러스터드 인덱스이고 모든 보조 인덱스에 기본키가 붙어서 긴 키의 비용이 더 크게 번집니다.

```sql
CREATE TABLE t_bigint(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, v int);
CREATE TABLE t_uuid  (id uuid DEFAULT gen_random_uuid() PRIMARY KEY,        v int);
```

(공식 문서) PostgreSQL 16 datatype-uuid 페이지는 uuid가 128비트이고 분산 시스템에서는 단일 데이터베이스 안에서만 유일한 시퀀스보다 유일성 보장이 좋다고 한다. functions-uuid 페이지(16)는 내장 생성 함수가 v4(무작위)인 `gen_random_uuid()` 하나이고 다른 알고리즘은 uuid-ossp 모듈이라고 한다. 현재 버전(docs/current, 확인 시점의 현재는 18) 문서에는 시간순 v7을 만드는 `uuidv7()`이 있지만 16 문서에는 없다. sql-cluster 페이지는 CLUSTER가 일회성 정렬이고 이후 변경은 정렬 순서를 유지하지 않는다고 한다. MySQL 8.4 innodb-index-types 페이지는 기본키가 클러스터드 인덱스이고, 보조 인덱스 레코드가 기본키 컬럼을 포함하므로 기본키가 길면 보조 인덱스가 커진다고 한다. miscellaneous-functions 페이지는 `UUID_TO_BIN(uuid, 1)`의 시간 부분 교환이 v1 UUID일 때 인덱스 효율에 도움이 될 수 있다고 한다.
(실험 확인) PostgreSQL 16.15에서 20만 행을 넣었을 때 bigint 테이블은 테이블 8680kB/기본키 인덱스 4408kB, uuid 테이블은 10216kB/기본키 인덱스 8.4~8.6MB 안팎(무작위 값이라 실행마다 조금 다름)이었고, 컬럼 크기는 8바이트 대 16바이트였다. `ANALYZE` 후 `pg_stats`의 물리 순서 상관도는 bigint 1.000, uuid는 0에 가까운 값(-0.003)이었다. UUID 테이블을 `CLUSTER`하면 상관도가 1.000이 되었지만 10만 행을 더 넣자 0.449로 떨어졌다(실행마다 값이 달랐다). 16.15에서 `uuidv7()`을 호출하면 함수가 없다는 오류가 났다. MySQL 8.4.11(InnoDB)에서 20만 행 + `v` 보조 인덱스 기준으로 bigint 기본키는 데이터 6672kB/보조 인덱스 4624kB였고, `binary(16)` 기본키는 `RANDOM_BYTES(16)` 값이면 데이터 약 12.8~13.9MB/보조 인덱스 5648kB, 시간 순서가 있는 `UUID_TO_BIN(UUID())` 값이면 8720kB/5648kB였다. 이 크기는 이 데이터와 버전에서의 값이다.
(보충) 무작위 키는 B-tree 인덱스의 임의 위치에 삽입되고 증가하는 키는 끝쪽에 삽입된다는 설명은 일반적인 인덱스 동작 설명이고, 이번에 직접 확인한 것은 위의 테이블 물리 순서 상관도와 크기다. 삽입 성능이나 캐시 적중률에 미치는 영향은 하드웨어와 데이터량에 크게 의존해 이번에는 시간 수치를 재지 않았다. 순번 노출을 피하려고 UUID를 쓴다는 설명은 일반적인 실무 이유이며 문서에 근거가 있는 것은 아니다.
