---
slug: "dbi-09"
topic: "db-index"
tier: DEEP
difficulty: 3
title: "Index Only Scan인데도 Heap Fetches가 발생하는 이유는 무엇인가요?"
keywords: ["MVCC 가시성은 힙에 있음", "visibility map", "all-visible 비트", "VACUUM이 비트 설정", "쓰기가 잦으면 이점 감소"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-index-only-scans.html", "https://www.postgresql.org/docs/16/storage-vm.html"]
---
**모범 답변 (30~60초)**
PostgreSQL에서 MVCC 가시성 정보는 인덱스 항목이 아니라 힙 튜플에만 있기 때문입니다. Index Only Scan은 후보 항목을 인덱스에서 찾은 뒤 해당 힙 페이지의 visibility map 비트를 확인해서, 페이지가 all-visible, 즉 모든 행이 모든 트랜잭션에게 보이는 상태면 힙을 읽지 않고 값을 돌려줍니다. 비트가 꺼져 있으면 힙에서 가시성을 확인해야 하는데 이 접근이 EXPLAIN의 Heap Fetches로 보입니다. 이 비트는 VACUUM이 켜고 그 페이지에 쓰기가 일어나면 꺼지므로, 자주 바뀌는 테이블에서는 index-only의 이점이 줄고 autovacuum이 얼마나 따라가는지가 중요합니다.

(공식 문서) 11.9는 인덱스 항목에는 가시성 정보가 없고 힙 항목에만 있으며, PostgreSQL이 힙 페이지마다 모든 행이 현재와 미래의 모든 트랜잭션에게 보이는지를 visibility map의 비트로 추적한다고 한다. index-only scan은 이 비트가 켜져 있으면 추가 작업 없이 값을 돌려주고, 꺼져 있으면 힙을 방문하므로 일반 인덱스 스캔과 이득이 없다고 한다. 따라서 힙 페이지의 상당 비율이 all-visible일 때만 이득이다. 73.4(Visibility Map)는 비트가 보수적이어서 켜져 있으면 확실히 참이지만 꺼져 있다고 항상 거짓은 아니고, 비트는 VACUUM만 켜며 데이터를 수정하는 모든 연산이 해당 페이지에서 끈다고 한다. 또 인덱스는 VM을 갖지 않는다고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `ord2`(`(user_id) INCLUDE (amount)` 인덱스)에서 VACUUM 직후 `WHERE user_id = 777`은 `Heap Fetches: 0`, 버퍼 4개였다. `user_id` 700~800인 10,002행을 UPDATE하고 VACUUM 전에 `pg_visibility_map`을 보니 all-visible 페이지가 1,545개 중 2개였고, 같은 쿼리(101행)는 `Index Only Scan`이면서 `Heap Fetches: 202`, 버퍼 160개였다. VACUUM 뒤에는 1,545개 전부 all-visible이고 `Heap Fetches: 0`, 버퍼 4개로 돌아왔다. 202라는 숫자(결과 행 수의 두 배)가 나온 정확한 이유는 확인하지 않았다.
(보충) 쓰기가 잦은 테이블에서 이 비트가 다시 켜지는 속도는 VACUUM(autovacuum 포함)이 얼마나 자주 도느냐에 달려 있다는 것은 위 설명에서 도출한 일반 설명이며 문서가 특정 수치를 제시하지는 않는다. 또 EXPLAIN ANALYZE 출력의 `Heap Fetches` 항목이 이 힙 방문 횟수를 보여 준다는 설명은 위 두 문서에서 찾지 못했고 실험 출력으로 확인한 것이다.
