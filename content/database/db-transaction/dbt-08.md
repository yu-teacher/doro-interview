---
slug: "dbt-08"
topic: "db-transaction"
tier: DEEP
difficulty: 2
title: "PostgreSQL의 REPEATABLE READ는 phantom read까지 막는다던데 어떻게 동작하고, 'could not serialize access due to concurrent update' 에러는 언제 나나요?"
keywords: ["스냅샷 격리", "첫 문장이 실행된 시점의 스냅샷", "phantom read", "could not serialize access", "트랜잭션 전체를 처음부터 다시 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/mvcc-serialization-failure-handling.html"]
concepts: [isolation-level, mvcc]
importance: 2
links: [{to: "dbt-09", kind: FOLLOWUP}, {to: "dbt-16", kind: FOLLOWUP}, {to: "dbl-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 REPEATABLE READ는 스냅샷 격리로 구현되어, 트랜잭션의 첫 문장이 실행된 시점의 스냅샷을 끝까지 봅니다. 그래서 다른 트랜잭션이 중간에 커밋한 수정이나 새로 삽입한 행이 보이지 않고, 표준이 허용하는 phantom read도 일어나지 않습니다. 다만 내 스냅샷에서 보이던 행을 다른 트랜잭션이 먼저 수정하거나 삭제하고 커밋했는데 내가 그 행을 UPDATE나 DELETE하려고 하면 could not serialize access due to concurrent update 에러로 롤백됩니다. 이때 애플리케이션은 트랜잭션 전체를 처음부터 다시 실행해야 하고, PostgreSQL이 자동으로 재시도해 주지는 않습니다.

```sql
-- 세션 A
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;   -- 100
-- 세션 B: UPDATE accounts SET balance = balance + 10 WHERE id = 1; 커밋
SELECT balance FROM accounts WHERE id = 1;   -- 여전히 100
UPDATE accounts SET balance = balance + 1 WHERE id = 1;
-- ERROR:  could not serialize access due to concurrent update
```

(공식 문서) Transaction Isolation 절은 Repeatable Read가 트랜잭션 시작 전에 커밋된 데이터만 보고, 첫 비트랜잭션 제어 문장 시점의 스냅샷을 쓰며, 표준보다 강해 serialization anomaly를 제외한 모든 현상을 막는다고 한다. 앞서 수정한 트랜잭션이 커밋되면 위 에러로 롤백되고, 이때 전체 트랜잭션을 처음부터 재시도하면 새 스냅샷에서 변경이 보여 충돌이 없다고 설명한다. Serialization Failure Handling 절은 SQLSTATE 40001을 재시도하되 결정 로직까지 포함한 트랜잭션 전체를 다시 실행해야 하며, 자동 재시도 기능은 정확성을 보장할 수 없어 제공하지 않는다고 한다.
(실험 확인) PostgreSQL 16.15에서 세션 A의 SELECT 두 번은 모두 100이었고 B가 삽입한 행도 보이지 않았다(행 수 2 유지). A의 UPDATE는 위 에러였고, A를 새 트랜잭션으로 다시 하자 110을 읽고 UPDATE해 최종 111이 됐다. 반례로 B가 스냅샷 이후 새로 삽입한 행(id 3)을 A가 UPDATE하면 에러 없이 0행이 갱신됐고, B가 `SELECT ... FOR UPDATE`로 잠금만 잡고 커밋한 행을 A가 UPDATE하는 것은 에러 없이 성공했다(문서가 말하는 '실제로 갱신·삭제한 경우만'과 일치).
