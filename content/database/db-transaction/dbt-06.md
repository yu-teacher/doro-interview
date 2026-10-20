---
slug: "dbt-06"
topic: "db-transaction"
tier: BASIC
difficulty: 2
title: "MVCC가 무엇이고, PostgreSQL에서 읽기와 쓰기가 서로 막지 않는 이유는 무엇인가요?"
keywords: ["MVCC", "스냅샷", "새 행 버전", "읽기는 쓰기를 막지 않고", "쓰기끼리는"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/mvcc-intro.html", "https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/ddl-system-columns.html"]
---
**모범 답변 (30~60초)**
MVCC는 한 행의 여러 버전을 유지하면서 각 트랜잭션이나 문장이 자기 스냅샷에 맞는 버전을 보게 하는 방식입니다. PostgreSQL 16에서는 UPDATE가 기존 행을 덮어쓰지 않고 새 행 버전을 만들기 때문에, 읽는 쪽은 자기 스냅샷에 해당하는 옛 버전을 그대로 읽습니다. 그래서 읽기를 위한 잠금이 쓰기 잠금과 충돌하지 않아 읽기는 쓰기를 막지 않고 쓰기도 읽기를 막지 않습니다. 다만 같은 행을 동시에 수정하려는 쓰기끼리는 먼저 수정한 트랜잭션이 끝날 때까지 기다립니다.

(공식 문서) Concurrency Control 소개 절은 각 SQL 문장이 과거 어느 시점의 데이터베이스 버전 스냅샷을 보고, MVCC에서는 읽기용 잠금이 쓰기용 잠금과 충돌하지 않아 읽기가 쓰기를, 쓰기가 읽기를 막지 않으며 가장 엄격한 격리인 Serializable에서도 이 보장을 유지한다고 설명한다. 행 수준 잠금은 데이터 조회에 영향을 주지 않고 같은 행의 쓰기와 잠금 요청만 막는다고 Explicit Locking 절이 밝히고, 시스템 컬럼 문서는 행을 갱신할 때마다 같은 논리 행의 새 행 버전이 생긴다고 한다.
(실험 확인) PostgreSQL 16.15에서 한 세션이 행을 UPDATE하고 커밋하지 않은 동안 다른 세션의 SELECT(기본 READ COMMITTED)는 `lock_timeout` 1초를 걸어 둔 채 약 0.4ms 만에 커밋된 값(100)을 읽었다. REPEATABLE READ 트랜잭션이 읽기만 하며 열려 있는 동안 다른 세션의 UPDATE와 INSERT는 `lock_timeout` 1초 안에 즉시 끝났다(각각 약 3.4ms, 0.4ms). 반대로 같은 행을 UPDATE한 두 트랜잭션에서 두 번째 UPDATE는 첫 트랜잭션이 커밋할 때까지 약 3초 기다렸다(첫 트랜잭션이 4초 동안 열려 있었던 실행이며 시간은 환경에 따라 다르다).
