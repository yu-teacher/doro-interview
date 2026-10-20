---
slug: "dbt-05"
topic: "db-transaction"
tier: BASIC
difficulty: 2
title: "SAVEPOINT는 무엇이고, PostgreSQL 트랜잭션 안에서 문장이 실패하면 어떻게 되나요?"
keywords: ["표시점", "ROLLBACK TO SAVEPOINT", "RELEASE SAVEPOINT", "aborted 상태", "부분 롤백"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-savepoint.html", "https://www.postgresql.org/docs/16/tutorial-transactions.html", "https://dev.mysql.com/doc/refman/8.4/en/savepoint.html"]
---
**모범 답변 (30~60초)**
SAVEPOINT는 트랜잭션 안에 찍는 표시점입니다. `ROLLBACK TO SAVEPOINT`를 하면 그 이후 실행한 명령만 취소하고 트랜잭션은 계속 이어가며, `RELEASE SAVEPOINT`는 표시점만 없애고 그 이후의 변경은 유지합니다. PostgreSQL 16에서는 트랜잭션 블록 안에서 문장 하나가 에러를 내면 트랜잭션이 aborted 상태가 되어 트랜잭션 블록이 끝날 때까지 이후 명령이 모두 거부됩니다. 이때 전체를 롤백하지 않고 제어권을 되찾는 방법이 바로 ROLLBACK TO SAVEPOINT여서, 실패할 수 있는 문장을 세이브포인트로 감싸 부분 롤백을 합니다.

```sql
-- 가정: sq(id serial PRIMARY KEY, v int)에 id = 1 행이 이미 있다
BEGIN;
INSERT INTO sq(v) VALUES (10);
SAVEPOINT s1;
INSERT INTO sq(id, v) VALUES (1, 100);   -- ERROR: duplicate key value violates unique constraint
ROLLBACK TO s1;                           -- 이후에도 트랜잭션 계속
INSERT INTO sq(v) VALUES (11);
COMMIT;                                   -- 이 트랜잭션에서는 10과 11만 저장된다
```

(공식 문서) SAVEPOINT 문서는 세이브포인트가 트랜잭션 블록 안에서만 만들 수 있고 여러 개를 둘 수 있다고 한다. 튜토리얼은 시스템이 에러로 aborted 상태로 만든 트랜잭션 블록의 제어를 되찾는 유일한 방법이 전체 롤백을 제외하면 ROLLBACK TO라고 하며, 롤백이나 해제는 그 뒤에 만든 세이브포인트를 자동 해제한다고 한다. 같은 이름을 다시 만들면 PostgreSQL은 이전 것을 남겨 두고 최신 것만 쓰며(최신 것을 해제하면 이전 것이 다시 접근 가능), MySQL 8.4 문서는 같은 이름이면 이전 세이브포인트를 지운다고 한다.
(실험 확인) PostgreSQL 16.15에서 중복 키 INSERT가 실패한 뒤 `SELECT 1`은 `current transaction is aborted, commands ignored until end of transaction block`으로 거부됐다. 위 SQL을 실행하자 기존 id 1 행에 더해 10과 11만 새로 저장됐고 실패한 INSERT의 행은 남지 않았다.
