---
slug: "dbt-03"
topic: "db-transaction"
tier: BASIC
difficulty: 1
title: "PostgreSQL의 기본 격리 수준은 무엇이고, 그 수준에서 한 트랜잭션 안의 두 SELECT는 어떻게 동작하나요?"
keywords: ["READ COMMITTED", "문장이 시작된 순간까지 커밋된 데이터의 스냅샷", "non-repeatable read", "default_transaction_isolation", "SET TRANSACTION"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/runtime-config-client.html", "https://www.postgresql.org/docs/16/sql-set-transaction.html"]
concepts: [isolation-level]
importance: 3
links: [{to: "dbt-08", kind: FOLLOWUP}, {to: "dbt-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 기본 격리 수준은 READ COMMITTED입니다. 이 수준에서 각 SELECT는 그 문장이 시작된 순간까지 커밋된 데이터의 스냅샷을 봅니다. 그래서 같은 트랜잭션 안에서 두 번 SELECT하는 사이에 다른 트랜잭션이 커밋하면 두 번째 SELECT는 바뀐 값을 보는 non-repeatable read가 생길 수 있습니다. 자기 트랜잭션이 앞서 바꾼 내용은 커밋 전이어도 보입니다. 기본값은 `default_transaction_isolation`으로 바꾸고, 한 트랜잭션만 바꾸려면 BEGIN 직후나 `SET TRANSACTION`으로 첫 쿼리 전에 지정합니다.

```sql
BEGIN;                                       -- READ COMMITTED
SELECT balance FROM accounts WHERE id = 2;   -- 200
-- (다른 세션이 balance를 201로 바꾸고 커밋)
SELECT balance FROM accounts WHERE id = 2;   -- 201
COMMIT;
```

(공식 문서) Transaction Isolation 절은 Read Committed를 기본으로, SELECT가 문장 시작 전에 커밋된 데이터만 보고 같은 트랜잭션의 연속된 두 SELECT가 다른 데이터를 볼 수 있다고 설명한다. 서버 설정 문서는 `default_transaction_isolation`의 기본이 read committed라고 하고, `SET TRANSACTION` 문서는 격리 수준을 첫 쿼리나 데이터 변경 문장 이후에는 바꿀 수 없다고 한다.
(실험 확인) PostgreSQL 16.15에서 위 시나리오를 두 세션으로 실행했다. 첫 SELECT는 200, 다른 세션의 커밋 뒤 두 번째 SELECT는 201이었다.
