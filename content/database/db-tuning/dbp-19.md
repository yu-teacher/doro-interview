---
slug: "dbp-19"
topic: "db-tuning"
tier: TRICKY
difficulty: 3
title: "오래 열려 있는 트랜잭션이 있으면 VACUUM과 테이블 크기에 어떤 영향이 있나요?"
keywords: ["아직 보일 수 있는 행 버전", "제거할 수 없는 죽은 행", "bloat 누적", "backend_xmin", "idle_in_transaction_session_timeout"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/routine-vacuuming.html", "https://www.postgresql.org/docs/16/runtime-config-client.html", "https://www.postgresql.org/docs/16/monitoring-stats.html", "https://www.postgresql.org/docs/16/sql-vacuum.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 VACUUM은 어떤 트랜잭션의 스냅샷에서 아직 보일 수 있는 죽은 행 버전은 지울 수 없습니다. 그래서 스냅샷을 쥔 채 오래 열려 있는 트랜잭션이 있으면 그 시점 이후에 생긴 죽은 행을 못 치워서, 그 사이 테이블과 인덱스가 계속 부풀 수 있습니다. 공식 문서는 열린 트랜잭션이 vacuum을 막아 bloat에 기여할 수 있다고 하고, 오래된 트랜잭션은 pg_stat_activity의 backend_xmin 같은 값으로 찾아 끝내라고 하며, idle_in_transaction_session_timeout으로 트랜잭션 안에서 놀고 있는 세션을 끊을 수 있다고 합니다. 그래서 트랜잭션 안에서 외부 API 호출처럼 오래 걸리는 일을 하지 않는 게 중요합니다.

```sql
-- 세션 A
BEGIN ISOLATION LEVEL REPEATABLE READ; SELECT count(*) FROM lt; SELECT pg_sleep(9);
-- 세션 B (A가 열려 있는 동안)
UPDATE lt SET v = v + 1;
VACUUM (VERBOSE) lt;
-- tuples: 0 removed, 200000 remain, 100000 are dead but not yet removable
```

(공식 문서) Routine Vacuuming은 오래된 행 버전을 어떤 트랜잭션이 아직 볼 수 있다면 삭제할 수 없다고 하고, wraparound 대응 절은 오래 열린 트랜잭션을 pg_stat_activity의 age(backend_xid)·age(backend_xmin)로 찾아 커밋·롤백하거나 pg_terminate_backend로 끝내라고 한다. idle_in_transaction_session_timeout 문서는 열린 트랜잭션 안에서 오래 유휴인 세션이 방금 죽은 튜플의 vacuum을 막아 bloat에 기여할 수 있다고 하며 기본값 0은 비활성이다.
(실험 확인) PostgreSQL 16.15, 10만 행 테이블 lt(autovacuum 끔). 세션 A가 REPEATABLE READ 트랜잭션에서 조회 후 9초 대기하는 동안 세션 B가 전체 행을 UPDATE하고 VACUUM VERBOSE를 하자 `tuples: 0 removed, 200000 remain, 100000 are dead but not yet removable`이었고, pg_stat_activity에서 A의 backend_xmin은 null이 아니었다. A가 끝난 뒤 같은 VACUUM은 `100000 removed, 100000 remain, 0 are dead but not yet removable`이었다. 반례로, 세션 A를 READ COMMITTED로 열어 SELECT 한 번만 하고 idle in transaction 상태로 둔 채 같은 UPDATE 후 VACUUM VERBOSE를 하면 `100000 removed, 100000 remain, 0 are dead but not yet removable`이었고 backend_xmin은 null이었다. 같은 조건에서 REPEATABLE READ는 `0 removed, 200000 remain, 100000 are dead but not yet removable`이고 backend_xmin이 null이 아니었다. 즉 문서가 말하는 "열린 트랜잭션이 막을 수 있다"는 이 실험에서 스냅샷을 쥔 경우에 해당했고, 질의 실행 중이 아닌 READ COMMITTED 유휴 트랜잭션은 막지 않았다.
(보충) 장기 트랜잭션이 복제 지연이나 락 대기 같은 다른 문제도 일으킨다는 점은 일반적 설명이며 위 실험 범위 밖이다. READ COMMITTED에서 쓰기를 한 트랜잭션처럼 트랜잭션 ID를 가진 경우나 실행이 긴 질의가 스냅샷을 오래 쥐는 경우는 실험하지 않았다. backend_xmin으로 오래된 세션을 찾으라는 문서의 안내는 XID wraparound 대응 절에 있는 문장이다.
