---
slug: "dbt-16"
topic: "db-transaction"
tier: TRICKY
difficulty: 3
title: "REPEATABLE READ에서 스냅샷 이후 다른 트랜잭션이 커밋한 변경이 있는 행을 UPDATE하면 PostgreSQL과 MySQL InnoDB는 어떻게 다르게 동작하나요?"
keywords: ["직렬화 실패 에러", "최신 커밋 값에 적용", "일반 SELECT는 스냅샷", "DML에는 스냅샷이 항상 적용되지는 않아", "처음부터 재시도"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 REPEATABLE READ에서는 내 스냅샷 이후에 다른 트랜잭션이 수정하고 커밋한 행을 UPDATE하면 직렬화 실패 에러로 롤백되어 처음부터 재시도해야 합니다. MySQL 8.4(InnoDB)의 REPEATABLE READ에서는 에러 없이 UPDATE가 최신 커밋 값에 적용됩니다. 일반 SELECT는 스냅샷을 보지만 DML에는 스냅샷이 항상 적용되지는 않아 UPDATE와 DELETE가 방금 커밋된 행을 건드릴 수 있고, 그 결과 내가 바꾼 행은 스냅샷에 없던 변경까지 포함해서 보이게 됩니다. 같은 REPEATABLE READ라는 이름이어도 충돌을 에러로 알려 주느냐 조용히 합쳐 주느냐가 다릅니다.

| 시나리오 | PostgreSQL 16 | MySQL 8.4(InnoDB) |
|---|---|---|
| A가 100을 읽은 뒤 B가 +10 커밋, A가 +1 UPDATE | ERROR: could not serialize access due to concurrent update | 성공, 이후 SELECT는 111 |
| B가 새 행(id=3)을 삽입·커밋한 뒤 A의 일반 SELECT 행 수 | 변화 없음(2) | 변화 없음(2) |
| 그 새 행(id=3)을 A가 UPDATE | 0행 갱신, 에러 없음 | 1행 갱신, 이후 SELECT는 301 |

```sql
-- MySQL 8.4(InnoDB), REPEATABLE READ
START TRANSACTION;
SELECT balance FROM accounts WHERE id = 1;            -- 100
-- 다른 세션: UPDATE ... +10; INSERT (3, 300); 커밋
UPDATE accounts SET balance = balance + 1 WHERE id = 1;
SELECT balance FROM accounts WHERE id = 1;            -- 111 (스냅샷에 없던 +10 포함)
UPDATE accounts SET balance = balance + 1 WHERE id = 3;
SELECT balance FROM accounts WHERE id = 3;            -- 301 (UPDATE 전에는 안 보이던 행)
```

(공식 문서) MySQL의 Consistent Nonlocking Reads 절은 스냅샷이 SELECT에 적용되며 DML에는 반드시 적용되지 않는다고 한다. 다른 REPEATABLE READ 트랜잭션이 방금 커밋한 행을 DELETE·UPDATE가 건드릴 수 있고, 트랜잭션이 다른 트랜잭션이 커밋한 행을 바꾸면 그 변경은 현재 트랜잭션에 보이게 된다고 설명하며 같은 절은 이 때문에 존재한 적 없는 테이블 상태를 볼 수 있는 이상 현상도 언급한다. PostgreSQL의 Transaction Isolation 절은 Repeatable Read에서 UPDATE·DELETE가 트랜잭션 시작 시점에 커밋된 행만 대상으로 찾고, 그 행을 다른 트랜잭션이 수정·삭제하고 커밋했으면 직렬화 실패 에러와 전체 재시도로 처리한다고 한다.
(실험 확인) 위 두 시나리오를 PostgreSQL 16.15와 MySQL 8.4.11에서 두 세션으로 실행한 결과가 표와 코드 주석이다. PostgreSQL에서는 재시도하면 110을 읽고 UPDATE해 111이 됐고, 새 행(id=3)에 대한 A의 UPDATE는 0행이었다. B가 새 행을 커밋한 뒤 A의 일반 SELECT 행 수는 PostgreSQL·MySQL 모두 2였다.
