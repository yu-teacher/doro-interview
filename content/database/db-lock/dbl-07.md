---
slug: "dbl-07"
topic: "db-lock"
tier: BASIC
difficulty: 2
title: "누가 누구를 막고 있는지 PostgreSQL에서는 어떻게 확인하나요?"
keywords: ["pg_stat_activity wait_event", "pg_blocking_pids", "pg_locks granted=false", "idle in transaction"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/monitoring-stats.html", "https://www.postgresql.org/docs/16/view-pg-locks.html", "https://www.postgresql.org/docs/16/functions-info.html", "https://www.postgresql.org/docs/16/runtime-config-client.html", "https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-locks-table.html"]
concepts: [db-locking, observability]
importance: 2
links: [{to: "dbl-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서는 pg_stat_activity의 state, wait_event_type, wait_event로 락(Lock) 대기 세션을 찾고, pg_blocking_pids(pid)가 그 세션을 막는 프로세스 ID 배열을 돌려줍니다. pg_locks는 잠금 대상·모드·프로세스별로 한 줄씩 보여 주고 granted가 false면 기다리는 중입니다. 행 락은 pg_locks에 직접 안 나오고, 행을 기다리는 세션은 보통 락을 쥔 트랜잭션 ID를 기다리는 것으로 보입니다. pg_locks끼리 조인하기보다 pg_blocking_pids를 쓰라고 문서도 권합니다. idle in transaction 블로커는 idle_in_transaction_session_timeout으로 끊을 수 있습니다. MySQL 8.4는 performance_schema.data_locks를 봅니다.

```sql
SELECT pid, state, wait_event_type, wait_event,
       pg_blocking_pids(pid) AS blocked_by, left(query, 40) AS query
FROM pg_stat_activity WHERE datname = current_database();
```

(공식 문서) pg_locks 문서(view-pg-locks): 뷰는 잠금 대상·요청 모드·프로세스별로 한 행이고 `granted`가 false면 락을 기다리는 중이고, 행 락 정보는 디스크에 저장되어 보통 이 뷰에 나타나지 않으며 행 락을 기다리는 프로세스는 보통 현재 보유자의 트랜잭션 ID를 기다리는 것으로 나타난다고 한다. pg_locks 끼리의 조인은 락 모드 충돌과 대기열 순서를 알아야 해서 정확히 하기 어려우므로 `pg_blocking_pids()`를 쓰라고 한다. functions-info: `pg_blocking_pids`는 보유(hard)뿐 아니라 대기열에서 앞선 대기자(soft)도 막는 쪽으로 센다. monitoring-stats의 `wait_event_type`이 `Lock`이면 `wait_event`에 `transactionid`, `relation` 등 락 종류가 나온다. monitoring-stats는 `state`의 값으로 `idle in transaction`(트랜잭션 안에서 쿼리를 실행하지 않는 중)을 든다. runtime-config-client의 `idle_in_transaction_session_timeout`은 열린 트랜잭션에서 유휴 상태로 있는 세션을 지정 시간 뒤 끊으며, 그런 세션이 락을 오래 쥐지 않게 하는 데 쓸 수 있다고 한다. MySQL 8.4 performance-schema-data-locks-table: `data_locks`가 InnoDB의 보유·요청 락을 보여 준다.
(실험 확인) PostgreSQL 16.15에서 세션 A가 UPDATE 후 커밋하지 않은 상태로 두고 B가 같은 행을 UPDATE하자 위 쿼리는 B를 `state=active, wait_event_type=Lock, wait_event=transactionid, blocked_by={A의 pid}`로 보여 줬다. `pg_locks`에는 B의 `transactionid ShareLock granted=f` 한 줄이 있었다.
