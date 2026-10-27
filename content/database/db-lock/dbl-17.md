---
slug: "dbl-17"
topic: "db-lock"
tier: TRICKY
difficulty: 3
title: "PostgreSQL의 SERIALIZABLE은 락으로 동시성을 막나요? 왜 직렬화 실패가 나고 REPEATABLE READ와는 무엇이 다른가요?"
keywords: ["SSI 비차단 감시", "SIReadLock 술어 락", "직렬화 실패 40001", "REPEATABLE READ 허용 이상 현상", "재시도"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/applevel-consistency.html"]
concepts: [isolation-level, db-locking]
importance: 1
links: [{to: "dbl-14", kind: PREREQ}, {to: "dbt-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 SERIALIZABLE은 REPEATABLE READ와 똑같이 스냅샷으로 동작하면서, 직렬 실행으로는 나올 수 없는 읽기 쓰기 의존성 패턴이 생기는지를 추가로 감시합니다. 이때 쓰는 술어 락(SIReadLock)은 아무도 블로킹하지 않으므로 데드락의 원인이 되지 않고, 대신 위험한 패턴이 감지되면 트랜잭션 하나를 SQLSTATE 40001 직렬화 실패로 중단시킵니다. 두 트랜잭션이 같은 조건으로 집계를 읽고 서로 다른 행을 바꾸는 경우가 대표적인데, REPEATABLE READ에서는 둘 다 커밋되어 비즈니스 규칙이 깨질 수 있습니다. 그래서 SERIALIZABLE을 쓰는 애플리케이션은 40001 오류가 나면 트랜잭션을 처음부터 재시도하는 로직이 필수이고, 감시에 오버헤드가 있습니다.

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
SELECT count(*) FROM oncall WHERE on_call;          -- 2명이면
UPDATE oncall SET on_call = false WHERE doc = 'kim'; -- 나는 빠져도 된다고 판단
COMMIT;                                              -- 동시에 lee도 같은 판단 -> 하나는 40001
```

(공식 문서) transaction-iso 13.2.2~13.2.3절: Repeatable Read는 스냅샷 격리 방식이며 직렬화 이상(serialization anomaly)은 막지 못한다. Serializable은 Repeatable Read와 똑같이 동작하되 직렬 실행과 어긋날 조건을 모니터링하고, 이 모니터링은 블로킹을 더하지 않으나 오버헤드가 있으며 감지되면 직렬화 실패를 낸다. 술어 락은 블로킹을 일으키지 않아 데드락의 원인이 될 수 없고 `pg_locks`에 `SIReadLock`으로 보인다. 직렬화 실패는 SQLSTATE 40001이며 재시도 로직이 필요하다. applevel-consistency 13.4절은 Serializable을 모든 쓰기와 일관된 읽기에 쓰면 다른 노력이 필요 없다고 하고, hot standby·논리 복제에는 이 보호가 아직 확장되지 않는다고 경고한다.
(실험 확인) PostgreSQL 16.15, `oncall` 두 행(kim, lee 모두 true)에서 두 트랜잭션이 각각 `count(*)=2`를 읽고 서로 다른 행을 false로 바꿨다. REPEATABLE READ에서는 둘 다 커밋되어 최종 `kim|f, lee|f`(당직 0명)가 됐다. SERIALIZABLE에서는 한쪽이 `ERROR: could not serialize access due to read/write dependencies among transactions`(`Reason code: Canceled on identification as a pivot, during write.`, `The transaction might succeed if retried.`)로 중단되어 한 명은 당직으로 남았다(재실행에서는 늦게 끝난 쪽이 중단돼 최종 `kim|f, lee|t`이며, 어느 쪽이 중단될지는 타이밍에 따라 달라질 수 있다). SERIALIZABLE 트랜잭션이 `SELECT`한 직후 `pg_locks`에 해당 테이블의 `SIReadLock`이 보였다.
(보충) 이 시나리오를 흔히 '쓰기 왜곡(write skew)'이라 부른다. 이 용어는 참고한 문서에는 나오지 않는다.
