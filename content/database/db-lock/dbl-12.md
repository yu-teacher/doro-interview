---
slug: "dbl-12"
topic: "db-lock"
tier: DEEP
difficulty: 2
title: "어드바이저리 락(advisory lock)은 무엇이고 세션 레벨과 트랜잭션 레벨은 어떻게 다른가요?"
keywords: ["애플리케이션 정의 락", "세션 레벨과 트랜잭션 레벨", "pg_try_advisory_lock", "롤백해도 세션 락 유지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/functions-admin.html", "https://www.postgresql.org/docs/16/view-pg-locks.html", "https://dev.mysql.com/doc/refman/8.4/en/locking-functions.html"]
concepts: [distributed-lock, db-locking]
importance: 2
links: [{to: "dbl-16", kind: FOLLOWUP}, {to: "cch-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
어드바이저리 락은 테이블 행이 아니라 애플리케이션이 정한 숫자 키에 거는 락이고, 서버는 사용을 강제하지 않으니 쓰는 쪽이 약속대로 써야 합니다. PostgreSQL 16에서 세션 레벨 락은 명시적으로 풀거나 세션이 끝날 때까지 유지되고 트랜잭션 의미를 따르지 않아서, 트랜잭션 안에서 잡고 롤백해도 락이 남습니다. 트랜잭션 레벨 락은 트랜잭션이 끝나면 자동으로 풀리고 해제 함수가 없어 짧은 용도에 편합니다. pg_try_ 접두 함수는 기다리지 않고 true나 false를 돌려줍니다. 잡은 락은 pg_locks에서 보이고, 개수에는 공유 메모리 크기에 따른 상한이 있습니다. MySQL 8.4에는 비슷한 용도로 이름으로 거는 GET_LOCK이 있고, 이것도 커밋이나 롤백으로 풀리지 않습니다.

```sql
SELECT pg_try_advisory_xact_lock(42);   -- 트랜잭션 끝에 자동 해제, true/false 즉시 반환
SELECT pg_advisory_lock(42);            -- 세션 레벨: pg_advisory_unlock(42) 또는 세션 종료까지
```

(공식 문서) explicit-locking 13.3.5절: 어드바이저리 락은 애플리케이션이 정의한 의미를 가지며 시스템이 사용을 강제하지 않는다. 플래그 컬럼을 쓰는 것보다 빠르고 테이블 부풀림이 없으며 세션 종료 시 서버가 정리한다. 세션 레벨은 롤백된 트랜잭션에서 잡은 락도 유지되고 같은 락을 여러 번 잡으면 그만큼 풀어야 한다. LIMIT과 함께 락 함수를 쓰면 의도보다 많은 락이 잡힐 수 있다는 경고도 있다. functions-admin Table 9.102: `pg_advisory_lock`, `pg_advisory_xact_lock`, `pg_try_advisory_lock` 등과 공유(`_shared`) 변형. view-pg-locks: 단일 bigint 키는 `classid`·`objid`에 나뉘어 보이고 `objsubid`가 1이다. MySQL 8.4 locking-functions: `GET_LOCK(str, timeout)`은 이름이 있는 배타 락이며 트랜잭션 커밋·롤백으로 풀리지 않고 `RELEASE_LOCK` 또는 세션 종료 때 풀린다.
(실험 확인) PostgreSQL 16.15에서 한 세션이 `BEGIN` 안에서 `pg_advisory_lock(42)`와 `pg_advisory_xact_lock(43)`을 잡고 `ROLLBACK`했다. 그 뒤 `pg_locks`에는 키 42의 advisory 락만 남아 있었고(`objsubid=1`, `ExclusiveLock`, granted), 다른 세션의 `pg_try_advisory_lock(42)`는 false, `pg_try_advisory_lock(43)`은 true였다. 첫 세션이 `pg_advisory_unlock(42)` 한 뒤에는 42도 true였다.
