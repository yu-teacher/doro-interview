---
slug: "dbt-02"
topic: "db-transaction"
tier: BASIC
difficulty: 1
title: "격리 수준 네 가지와 이상 현상(dirty read, non-repeatable read, phantom read)을 설명해 주세요. PostgreSQL에서는 무엇이 다른가요?"
keywords: ["dirty read", "non-repeatable read", "phantom read", "serialization anomaly", "READ UNCOMMITTED는 READ COMMITTED처럼 동작"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/sql-set-transaction.html"]
---
**모범 답변 (30~60초)**
격리 수준은 동시 트랜잭션 사이에서 어떤 이상 현상을 허용하는지로 정의됩니다. dirty read는 커밋되지 않은 데이터를 읽는 것, non-repeatable read는 같은 행을 다시 읽었더니 다른 트랜잭션의 커밋으로 값이 바뀐 것, phantom read는 같은 조건으로 다시 조회했더니 행 집합이 바뀐 것입니다. PostgreSQL 16에서는 네 수준을 지정할 수 있지만 내부적으로는 세 가지만 구현해서 READ UNCOMMITTED는 READ COMMITTED처럼 동작하고, REPEATABLE READ는 표준보다 강해 phantom도 막으며, serialization anomaly까지 막는 것은 SERIALIZABLE뿐입니다.

PostgreSQL 16 기준 표(문서 Table 13.1을 요약했다).

| 격리 수준 | dirty read | non-repeatable read | phantom read | serialization anomaly |
|---|---|---|---|---|
| READ UNCOMMITTED | PG에서는 불가능 | 가능 | 가능 | 가능 |
| READ COMMITTED | 불가능 | 가능 | 가능 | 가능 |
| REPEATABLE READ | 불가능 | 불가능 | PG에서는 불가능 | 가능 |
| SERIALIZABLE | 불가능 | 불가능 | 불가능 | 불가능 |

(공식 문서) Transaction Isolation 절이 위 표와 네 가지 현상의 정의를 담고 있고, PostgreSQL의 Read Uncommitted가 Read Committed로 동작하는 이유를 MVCC 구조에 표준 수준을 대응시키는 유일하게 합당한 방법이기 때문이라고 설명한다. 표준은 각 수준에서 허용되면 안 되는 현상의 최소선만 정하므로 더 강한 보장은 표준 위반이 아니라고도 밝힌다. `SET TRANSACTION` 문서는 격리 수준을 첫 쿼리 이후에는 바꿀 수 없다고 한다.
(실험 확인) PostgreSQL 16.15에서 `BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED` 뒤 `SHOW transaction_isolation`은 `read uncommitted`로 나왔지만, 다른 세션이 UPDATE하고 아직 커밋하지 않은 행(100을 999로 변경)을 읽으면 커밋된 값 100이 나왔다. dirty read는 일어나지 않았다.
