---
slug: "dbl-01"
topic: "db-lock"
tier: BASIC
difficulty: 1
title: "PostgreSQL에서 락은 어떤 종류가 있고, 일반 SELECT는 언제 막히나요?"
keywords: ["테이블 락 8가지 모드", "행 락은 쓰는 쪽만 차단", "ACCESS EXCLUSIVE만 SELECT 차단", "트랜잭션 끝까지 유지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/view-pg-locks.html"]
concepts: [db-locking, mvcc]
importance: 3
links: [{to: "dbl-02", kind: FOLLOWUP}, {to: "dbl-09", kind: FOLLOWUP}, {to: "dbt-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 락은 주로 테이블 수준과 행 수준으로 나뉩니다. 명령은 대상 테이블에 알맞은 모드의 락을 자동으로 잡는데, 모드 이름에 row가 들어 있어도 여덟 가지는 모두 테이블 락이고 서로 어떤 모드와 충돌하느냐만 다릅니다. 일반 SELECT는 ACCESS SHARE를 잡고 이 모드는 ACCESS EXCLUSIVE와만 충돌하므로, DROP TABLE, TRUNCATE, VACUUM FULL, 많은 ALTER TABLE처럼 ACCESS EXCLUSIVE를 잡는 명령이 아니면 읽기는 막히지 않습니다. 행 락은 같은 행을 바꾸거나 잠그려는 쪽만 막고 일반 SELECT는 막지 않습니다. 그래서 한 트랜잭션이 행을 UPDATE하는 중에도 다른 세션은 커밋된 값을 바로 읽고, 같은 행을 UPDATE하려는 세션만 기다립니다. 락은 보통 트랜잭션이 끝날 때 풀립니다.

(공식 문서) explicit-locking 13.3.1~13.3.2절은 테이블 락 모드 여덟 가지(ACCESS SHARE부터 ACCESS EXCLUSIVE까지)가 모두 테이블 수준이며 이름은 역사적인 것이라고 한다. 두 트랜잭션은 충돌하는 모드의 락을 같은 테이블에 동시에 가질 수 없다. 팁으로 "ACCESS EXCLUSIVE 락만 (FOR UPDATE/SHARE 없는) SELECT를 막는다"고 쓰여 있다. 행 락은 "데이터 조회에 영향을 주지 않고 같은 행의 쓰기·잠금 쪽만 막는다"고 한다. 락은 트랜잭션 끝이나 세이브포인트 롤백 때 풀린다.
(실험 확인) PostgreSQL 16.15에서 세션 A가 `UPDATE accounts ... WHERE id=1`을 하고 4초간 커밋하지 않은 동안, 세션 B의 `SELECT`는 0.7ms에 끝났고 `id=2` 행 UPDATE도 2ms에 끝났다. `id=1` 행 UPDATE만 A가 커밋할 때까지 기다렸다가 진행됐다(재실행에서 약 2.4초). A가 UPDATE하는 동안 `pg_locks`에는 테이블 `accounts`의 `RowExclusiveLock`과 A 자신의 트랜잭션 ID 락이 보였다.
