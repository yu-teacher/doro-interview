---
slug: "dbl-02"
topic: "db-lock"
tier: BASIC
difficulty: 1
title: "SELECT ... FOR UPDATE는 무엇을 하고 언제 쓰나요?"
keywords: ["선택한 행에 배타 행 락", "트랜잭션 끝까지 유지", "일반 SELECT는 안 막힘", "읽고 갱신할 때 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/sql-select.html", "https://www.postgresql.org/docs/16/applevel-consistency.html"]
concepts: [db-locking]
importance: 3
links: [{to: "dbl-06", kind: FOLLOWUP}, {to: "dbl-08", kind: FOLLOWUP}, {to: "jpa-23", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 FOR UPDATE는 SELECT가 돌려주는 행에 행 락을 걸어서, 다른 트랜잭션이 그 행을 UPDATE나 DELETE하거나 FOR UPDATE, FOR SHARE로 잠그지 못하게 합니다. 락은 트랜잭션이 끝날 때까지 유지되고 일반 SELECT는 막지 않습니다. 값을 읽고 그 값을 바탕으로 같은 행을 바꿀 때 사이에 다른 트랜잭션이 끼어들지 못하게 하는, 비관적 락의 기본 도구입니다. 락이 걸린 행을 만나면 기본은 풀릴 때까지 기다리고, 기다린 뒤에는 갱신된 최신 행을 잠가서 돌려줍니다. 집계 함수와는 같이 쓸 수 없고 대상 테이블에 UPDATE 권한이 필요합니다. 자동 커밋 상태에서는 문장이 끝나면 곧바로 락이 풀리니 BEGIN으로 묶어야 의미가 있습니다.

```sql
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;  -- id=1 행 잠금
UPDATE accounts SET balance = balance - 30 WHERE id = 1;
COMMIT;                                                 -- 여기서 락 해제
```

(공식 문서) explicit-locking 13.3.2절은 FOR UPDATE가 다른 트랜잭션이 그 행을 잠그거나 수정하거나 삭제하지 못하게 한다고 하고, 기다린 FOR UPDATE는 갱신된 행을 잠그고 돌려주며(삭제됐으면 행 없음), REPEATABLE READ·SERIALIZABLE에서는 트랜잭션 시작 뒤 바뀐 행이면 오류가 난다고 한다. sql-select는 잠금 절을 집계와 함께 쓸 수 없고 FOR UPDATE에 UPDATE 권한이 필요하다고 한다.
(실험 확인) PostgreSQL 16.15에서 세션 A가 `id=1`을 FOR UPDATE로 잡고 있는 동안 세션 B의 일반 `SELECT`는 즉시 100을 돌려줬고, `id=1`에 `FOR SHARE NOWAIT`는 `could not obtain lock on row` 오류가 났으며, `id=2`에 `FOR UPDATE NOWAIT`는 성공했다. A가 커밋한 뒤에는 `id=1`도 성공했다. `SELECT count(*) ... FOR UPDATE`는 `FOR UPDATE is not allowed with aggregate functions` 오류였다. FOR UPDATE 직후 `pg_locks`에는 테이블 `RowShareLock`이 보였다. 자동 커밋(BEGIN 없이)으로 `SELECT ... FOR UPDATE` 뒤 3초 sleep하는 동안 다른 세션의 `FOR UPDATE NOWAIT`는 성공했다. READ COMMITTED에서 기다린 `FOR UPDATE`는 상대가 바꾼 값(500)을 돌려줬고 상대가 지운 행은 0행이었으며, REPEATABLE READ에서는 `could not serialize access due to concurrent update`였다.
