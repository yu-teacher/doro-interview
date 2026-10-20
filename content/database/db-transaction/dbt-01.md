---
slug: "dbt-01"
topic: "db-transaction"
tier: BASIC
difficulty: 1
title: "ACID는 각각 무엇이고, PostgreSQL은 이를 어떻게 보장하나요?"
keywords: ["원자성", "지속성", "WAL에 먼저 기록", "커밋 때 WAL을 영구 저장소에 flush", "MVCC 스냅샷"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/tutorial-transactions.html", "https://www.postgresql.org/docs/16/wal-intro.html", "https://www.postgresql.org/docs/16/wal-async-commit.html", "https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/runtime-config-wal.html"]
---
**모범 답변 (30~60초)**
ACID는 원자성, 일관성, 격리성, 지속성입니다. 원자성은 트랜잭션의 변경이 전부 반영되거나 전혀 반영되지 않는 것이고, 격리성은 진행 중인 다른 트랜잭션의 중간 상태가 보이지 않는 것입니다. 지속성은 커밋됐다고 응답한 변경이 장애 뒤에도 남는 것이고, 일관성은 제약 조건 같은 규칙을 지키는 상태에서 다른 유효한 상태로만 넘어가는 것입니다. PostgreSQL 16에서는 변경을 WAL에 먼저 기록하고 커밋 때 WAL을 영구 저장소에 flush하며, 크래시 뒤에는 WAL을 재생해 복구합니다. 격리는 MVCC 스냅샷으로 구현합니다.

(공식 문서) 튜토리얼 트랜잭션 절은 여러 단계를 all-or-nothing으로 묶는 것이 원자성이고, 열린 트랜잭션의 변경은 완료 전까지 다른 트랜잭션에 보이지 않으며, 완료를 응답하기 전에 모든 변경이 영구 저장소에 기록된다고 설명한다. WAL 절은 데이터 파일의 변경이 WAL 레코드를 flush한 뒤에만 기록되고, 그래서 커밋마다 데이터 페이지를 flush하지 않아도 크래시 후 REDO로 복구할 수 있다고 한다. 커밋은 기본이 동기식이고(서버 설정 문서의 `synchronous_commit` 기본값은 `on`) 이를 끄면 최근 트랜잭션이 유실될 수 있지만 데이터가 손상되지는 않는다고 Asynchronous Commit 절이 밝힌다.
(실험 확인) PostgreSQL 16.15에서 100행 INSERT 뒤 커밋 전에 WAL 삽입 위치는 이미 앞으로 가 있었지만 flush 위치는 거기에 미치지 못했고(`pg_current_wal_flush_lsn()`), COMMIT 뒤에는 flush 위치가 그 지점 이상이었다. 롤백한 INSERT는 남지 않았고 `SHOW synchronous_commit`은 `on`이었다. flush 시점은 WAL writer 타이밍에 따라 달라질 수 있어 이 실행에서 그랬다는 뜻이다.
(보충) 일관성(C)을 '규칙을 지키는 상태 사이의 이동'으로 푸는 정의는 일반적인 설명이며, PostgreSQL 문서가 한 줄로 정의한 것은 아니다.
