---
slug: "dbt-13"
topic: "db-transaction"
tier: DEEP
difficulty: 2
title: "오래 열려 있는 트랜잭션은 PostgreSQL에서 어떤 문제를 일으키고 어떻게 막나요?"
keywords: ["idle in transaction", "VACUUM 방해", "잠금", "idle_in_transaction_session_timeout", "트랜잭션을 짧게 유지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/runtime-config-client.html", "https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/routine-vacuuming.html", "https://www.postgresql.org/docs/16/sql-prepare-transaction.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서 오래 열린 트랜잭션은 두 가지 문제를 일으킵니다. 하나는 잠금입니다. 이미 잡은 락은 트랜잭션이 끝날 때까지 유지되고, 같은 행을 쓰려는 쪽은 교착 상태가 아니면 끝없이 기다립니다. 다른 하나는 VACUUM 방해입니다. 그 트랜잭션의 스냅샷이 볼 수도 있는 옛 행 버전은 지울 수 없어서 dead tuple이 쌓여 테이블이 부풀 수 있습니다. 특히 아무 일도 안 하며 열려 있는 idle in transaction 상태가 위험하므로 트랜잭션을 짧게 유지하고 사용자 입력을 기다리는 동안 열어 두지 않으며, `idle_in_transaction_session_timeout`으로 방치된 세션을 끊습니다.

(공식 문서) Explicit Locking의 Deadlocks 절은 교착이 아니라면 락을 기다리는 트랜잭션이 무한정 기다리므로 사용자 입력을 기다리며 트랜잭션을 길게 여는 것은 나쁜 생각이라고 한다. 서버 설정 문서는 `idle_in_transaction_session_timeout`이 열린 트랜잭션 안에서 유휴인 세션을 끊어 락 점유를 막고, 락이 거의 없어도 열린 트랜잭션은 그것만 볼 수 있는 최근 dead tuple을 vacuum하지 못하게 해 bloat를 부를 수 있다고 하며 기본값 0은 비활성이라고 한다. 준비된(prepared) 트랜잭션을 오래 두면 VACUUM이 방해받는다는 경고는 PREPARE TRANSACTION 문서에 있다. MySQL 8.4 Multi-Versioning 절도 InnoDB에서 읽기만 하는 트랜잭션조차 오래 열려 있으면 undo 로그를 폐기하지 못한다고 한다.
(실험 확인) PostgreSQL 16.15에서 REPEATABLE READ 트랜잭션이 열려 있는 동안 1000행을 DELETE하고 `VACUUM (VERBOSE)`를 하자 `tuples: 0 removed, 1000 remain, 1000 are dead but not yet removable`이었고, 그 트랜잭션이 끝난 뒤 같은 VACUUM은 `1000 removed`였다. `idle_in_transaction_session_timeout='1s'`로 BEGIN 후 3초 방치하자 `FATAL: terminating connection due to idle-in-transaction timeout`으로 연결이 끊겼다.
