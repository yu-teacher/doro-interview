---
slug: "dbt-09"
topic: "db-transaction"
tier: DEEP
difficulty: 3
title: "PostgreSQL의 SERIALIZABLE은 REPEATABLE READ와 무엇이 다르고, 어떤 이상 현상을 막으며 애플리케이션은 무엇을 해야 하나요?"
keywords: ["Serializable Snapshot Isolation", "write skew", "SQLSTATE 40001", "감시", "트랜잭션 전체를 다시 실행"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/mvcc-serialization-failure-handling.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 SERIALIZABLE은 REPEATABLE READ와 똑같이 스냅샷으로 동작하면서, 동시 트랜잭션들의 읽기·쓰기 의존 관계를 감시해 어떤 직렬 실행 순서와도 맞지 않는 결과가 나올 조건을 찾으면 한쪽을 실패시키는 Serializable Snapshot Isolation입니다. 두 트랜잭션이 각자 읽은 것을 근거로 서로 다른 행을 고쳐 둘 다 커밋되는 write skew 같은 현상도 막습니다. 추가 블로킹은 만들지 않는 대신 감시 오버헤드가 있고 SQLSTATE 40001로 실패할 수 있어서, 애플리케이션은 일반적인 재시도 처리를 갖추고 트랜잭션 전체를 다시 실행해야 합니다.

```sql
-- 당직 의사 둘(alice, bob)이 모두 on_call=true인 상태에서,
-- 각 트랜잭션이 '당직자가 2명 이상인지' 확인한 뒤 자기 자신을 on_call=false로 바꾸고 커밋한다.
SELECT count(*) FROM doctors WHERE on_call;
UPDATE doctors SET on_call = false WHERE name = 'alice';   -- 다른 쪽은 'bob'
```

(공식 문서) Serializable 절은 이 수준이 Repeatable Read와 같지만 직렬화 이상을 일으킬 조건을 추가로 감시하고, 이 감시가 Repeatable Read 이상의 블로킹을 만들지는 않지만 오버헤드가 있으며 해당 조건이 감지되면 serialization failure(SQLSTATE 40001)를 낸다고 한다. 또 읽은 데이터는 그 트랜잭션이 성공적으로 커밋되기 전에는 유효하다고 믿으면 안 되고, 가능하면 READ ONLY로 선언하고 커넥션 수를 제한하며 idle in transaction을 피하라고 권한다. 예외로 중복 키 검사 뒤 INSERT에서는 직렬 실행에서는 안 났을 unique 위반이 날 수 있다고 한다. 문서의 예시는 두 트랜잭션이 서로의 합계를 읽어 새 행을 넣는 경우다.
(실험 확인) PostgreSQL 16.15에서 위 시나리오를 동시에 실행했다. REPEATABLE READ에서는 둘 다 커밋되어 당직자가 0명이 됐고, SERIALIZABLE에서는 한쪽이 `could not serialize access due to read/write dependencies among transactions`(HINT: The transaction might succeed if retried.)로 실패하고 당직자 1명이 남았다. 실패한 쪽은 COMMIT 시점에 에러가 났고 DETAIL은 `Canceled on identification as a pivot, during commit attempt`였다. 에러 메시지의 세부 사유 코드는 실행마다 다를 수 있다.
(보충) 'write skew'라는 이름은 일반 용어이며 PostgreSQL 문서의 해당 절은 이 이름 대신 합계 예시로 설명한다.
