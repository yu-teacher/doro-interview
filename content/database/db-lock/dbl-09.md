---
slug: "dbl-09"
topic: "db-lock"
tier: DEEP
difficulty: 2
title: "PostgreSQL 테이블 락 모드에는 어떤 것이 있고, 운영 중 ALTER TABLE이 왜 다른 쿼리까지 멈추게 하나요?"
keywords: ["ACCESS EXCLUSIVE", "ROW EXCLUSIVE", "락 대기열", "lock_timeout으로 DDL 보호"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/sql-lock.html", "https://www.postgresql.org/docs/16/functions-info.html", "https://www.postgresql.org/docs/16/runtime-config-client.html"]
concepts: [db-locking, online-schema-change]
importance: 2
links: [{to: "dbl-01", kind: PREREQ}, {to: "dbd-21", kind: RELATED}, {to: "dbd-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 테이블 락은 ACCESS SHARE부터 ACCESS EXCLUSIVE까지 여덟 모드이고, SELECT는 ACCESS SHARE, FOR UPDATE는 ROW SHARE, INSERT·UPDATE·DELETE는 ROW EXCLUSIVE를 잡습니다. DROP TABLE, TRUNCATE와 많은 ALTER TABLE이 잡는 ACCESS EXCLUSIVE는 모든 모드와 충돌합니다. 문제는 대기열입니다. 오래 열린 트랜잭션이 SELECT로 ACCESS SHARE를 쥐고 있으면 ALTER TABLE은 그 트랜잭션이 끝나길 기다리는데, 그 뒤에 들어온 일반 SELECT도 대기 중인 ALTER 뒤에 줄을 서서 함께 막힙니다. 그래서 운영 중 DDL은 짧은 lock_timeout을 걸어 못 잡으면 포기하고 다시 시도하는 방식을 흔히 씁니다.

(공식 문서) explicit-locking 13.3.1절의 모드별 설명과 충돌표(Table 13.2): ACCESS EXCLUSIVE는 DROP TABLE, TRUNCATE, REINDEX, CLUSTER, VACUUM FULL과 ALTER TABLE의 여러 형태가 잡는다. 락은 보통 트랜잭션이 끝날 때까지 유지된다. functions-info의 `pg_blocking_pids` 설명은 락을 막는 쪽에 "충돌하는 락을 가진 쪽"뿐 아니라 "충돌하는 락을 기다리면서 대기열에서 앞서 있는 쪽"도 포함한다고 쓴다. runtime-config-client의 `lock_timeout`은 락 획득 대기를 제한한다. sql-lock은 `LOCK TABLE`의 기본 모드가 ACCESS EXCLUSIVE이고 `NOWAIT`를 줄 수 있다고 한다.
(실험 확인) PostgreSQL 16.15: 세션 A가 트랜잭션 안에서 `SELECT count(*)`를 하고 열어 둔 상태에서 세션 B가 `ALTER TABLE accounts ADD COLUMN ...`을 실행하자 `pg_locks`에 A의 `AccessShareLock`(granted)과 B의 `AccessExclusiveLock`(granted=false)이 보였다. 이후 세션 C의 일반 `SELECT count(*)`는 `lock_timeout=1s` 안에 끝나지 못하고 약 1.0초 뒤 락 타임아웃으로 중단됐다. DDL 쪽에 `lock_timeout='500ms'`를 걸고 같은 상황을 만들면 DDL이 500ms 뒤 오류로 포기했고 이어진 SELECT는 정상 실행됐다.
(보충) 운영 DDL에 짧은 lock_timeout을 걸고 실패하면 재시도하는 방식은 공식 문서의 권장이 아니라 일반적인 운영 관행이다. 이번에는 그 효과를 위 실험으로만 확인했다.
