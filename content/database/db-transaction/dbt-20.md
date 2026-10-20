---
slug: "dbt-20"
topic: "db-transaction"
tier: TRICKY
difficulty: 3
title: "SAVEPOINT로 롤백하면 그 사이에 잡은 행 락도 풀리나요? PostgreSQL과 MySQL의 차이는요?"
keywords: ["행 수준 락", "savepoint로 롤백할 때도 해제", "ROLLBACK TO SAVEPOINT", "메모리에 저장된 행 락은 해제하지 않아서", "undo로 해제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/sql-savepoint.html", "https://dev.mysql.com/doc/refman/8.4/en/savepoint.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서는 행 수준 락이 트랜잭션이 끝날 때뿐 아니라 savepoint로 롤백할 때도 해제됩니다. 그래서 세이브포인트 이후에 잡았던 락은 ROLLBACK TO 직후 다른 세션이 쓸 수 있게 됩니다. MySQL 8.4(InnoDB)는 다릅니다. ROLLBACK TO SAVEPOINT가 변경은 되돌리지만 세이브포인트 이후에 메모리에 저장된 행 락은 해제하지 않아서, 되돌린 행도 트랜잭션이 끝날 때까지 다른 세션이 기다려야 합니다. 새로 삽입한 행의 락은 undo로 해제됩니다.

```sql
BEGIN;                                     -- START TRANSACTION (MySQL)
UPDATE sp SET v = 1 WHERE id = 1;
SAVEPOINT s1;
UPDATE sp SET v = 1 WHERE id = 2;
ROLLBACK TO SAVEPOINT s1;
-- 이 상태에서 다른 세션이 id = 2 를 UPDATE 하면?
```

(공식 문서) PostgreSQL의 Row-Level Locks 절은 행 수준 락이 트랜잭션 종료 시 또는 savepoint 롤백 중에 해제된다고 한다. MySQL의 SAVEPOINT 문서는 ROLLBACK TO SAVEPOINT가 세이브포인트 이후 변경을 되돌리지만 InnoDB가 그 이후 메모리에 저장된 행 락은 해제하지 않으며, 새로 삽입한 행은 락 정보가 행의 트랜잭션 ID에 실려 있어 undo 때 해제된다고 한다.
(실험 확인) 위 시나리오에서 다른 세션이 `id = 2`를 UPDATE하자 PostgreSQL 16.15에서는 즉시 성공했고, MySQL 8.4.11에서는 `innodb_lock_wait_timeout`(1초) 뒤 `ERROR 1205 Lock wait timeout exceeded`로 실패했다. 롤백하지 않은 `id = 1`은 두 DB 모두 기다렸다(PostgreSQL은 `lock_timeout` 1초로 취소). MySQL에서 세이브포인트 뒤 새로 INSERT한 행(id 5)을 ROLLBACK TO한 경우에는 다른 세션의 같은 키 INSERT가 바로 성공해 문서의 '새로 삽입한 행은 undo로 해제'와 일치했다.
