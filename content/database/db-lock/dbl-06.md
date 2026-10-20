---
slug: "dbl-06"
topic: "db-lock"
tier: BASIC
difficulty: 2
title: "락을 무한정 기다리지 않게 하려면(NOWAIT, lock_timeout 등) 어떻게 하나요?"
keywords: ["NOWAIT 즉시 실패", "lock_timeout", "SQLSTATE 55P03", "innodb_lock_wait_timeout 기본 50초"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-select.html", "https://www.postgresql.org/docs/16/runtime-config-client.html", "https://www.postgresql.org/docs/16/errcodes-appendix.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html"]
concepts: [db-locking]
importance: 2
links: [{to: "dbd-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16은 기본적으로 충돌하는 락을 풀릴 때까지 무한정 기다립니다. 바로 실패시키려면 SELECT FOR UPDATE NOWAIT를 쓰고, 못 잡으면 즉시 오류가 납니다. 대기 시간에 상한을 두려면 lock_timeout을 세션이나 트랜잭션에 설정하는데, 락 한 번을 얻는 시도마다 적용되고 0이면 꺼져 있으며 postgresql.conf에 전역으로 두는 것은 권장되지 않습니다. 두 경우 모두 SQLSTATE는 55P03입니다. MySQL 8.4 InnoDB도 NOWAIT를 지원하고, 기본 대기 상한인 innodb_lock_wait_timeout이 50초라 넘으면 1205 오류가 나는데, 이때 트랜잭션 전체가 아니라 현재 문장만 롤백된다는 점이 다릅니다.

(공식 문서) PostgreSQL sql-select의 Locking Clause 절: NOWAIT는 행을 즉시 잠글 수 없으면 기다리는 대신 오류를 낸다(테이블 수준 ROW SHARE 락은 평소처럼 기다리므로 먼저 `LOCK ... NOWAIT`를 쓸 수 있다). errcodes-appendix: 55P03은 lock_not_available다. runtime-config-client: `lock_timeout`은 테이블·행 등 락을 얻으려고 기다리는 문장을 지정 시간 뒤 중단시키며 기본 0(끔), 명시·암묵 락 모두에 적용되고, `postgresql.conf` 설정은 모든 세션에 영향을 주므로 권장하지 않는다. MySQL 8.4 innodb-parameters: `innodb_lock_wait_timeout` 기본 50초, 초과하면 `ERROR 1205 ... Lock wait timeout exceeded`, 현재 문장만 롤백(`--innodb-rollback-on-timeout`이면 전체 롤백)하며 MySQL 테이블 락 대기에는 적용되지 않는다. innodb-locking-reads: `FOR UPDATE`/`FOR SHARE`에 `NOWAIT`, `SKIP LOCKED`를 쓸 수 있다.
(실험 확인) PostgreSQL 16.15: 다른 세션이 행을 FOR UPDATE로 잡은 상태에서 `FOR UPDATE NOWAIT`는 `ERROR: 55P03: could not obtain lock on row in relation "accounts"`, `SET lock_timeout='500ms'` 후의 UPDATE는 약 0.5초 뒤 `55P03: canceling statement due to lock timeout`이 났다. MySQL 8.4.11: 같은 상황에서 `NOWAIT`는 `ERROR 3572 (HY000)`, `innodb_lock_wait_timeout`을 2초로 낮춘 UPDATE는 약 2.0초 뒤 `ERROR 1205`가 났다. 같은 트랜잭션에서 앞서 한 다른 행의 UPDATE는 1205 뒤에도 유지돼 커밋됐다(`innodb_rollback_on_timeout` 기본 OFF에서 현재 문장만 롤백).
