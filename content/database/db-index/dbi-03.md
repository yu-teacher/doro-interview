---
slug: "dbi-03"
topic: "db-index"
tier: BASIC
difficulty: 2
title: "EXPLAIN 결과의 Seq Scan, Index Scan, Bitmap Heap Scan, Index Only Scan은 어떻게 다르고 언제 선택되나요?"
keywords: ["순차 스캔", "인덱스 후 힙 접근", "비트맵으로 물리 순서 정렬", "Index Only Scan은 힙 생략", "예상 비용 비교"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/indexes-bitmap-scans.html", "https://www.postgresql.org/docs/16/indexes-index-only-scans.html", "https://www.postgresql.org/docs/16/sql-explain.html"]
concepts: [query-planner]
importance: 2
links: [{to: "dbi-09", kind: FOLLOWUP}, {to: "dbp-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
Seq Scan은 테이블 전체를 순서대로 읽으면서 WHERE 조건을 필터로 적용합니다. Index Scan은 인덱스에서 조건에 맞는 항목을 찾고 항목마다 테이블, 즉 힙에서 행을 가져옵니다. Bitmap Index Scan과 Bitmap Heap Scan은 인덱스로 맞는 행의 위치를 먼저 모은 뒤 물리 순서로 정렬해서 힙을 읽어, 힙 접근이 흩어지는 비용을 줄이는 중간 방식입니다. Index Only Scan은 필요한 컬럼이 모두 인덱스에 있고 가시성 조건을 만족하면 힙을 읽지 않습니다. 어느 것을 쓸지는 플래너가 예상 행 수와 비용을 비교해 정하므로, 같은 인덱스라도 조건에 맞는 행 수에 따라 계획이 달라집니다.

(공식 문서) EXPLAIN 사용 절(14.1)은 최하위 노드가 스캔 노드이고 순차 스캔, 인덱스 스캔, 비트맵 인덱스 스캔이 있다고 하며, 플래너가 가장 싸다고 판단한 전략을 고른다는 전제로 비용 추정치를 읽는 법을 설명한다. 비트맵 계획은 자식 노드가 인덱스에서 행 위치를 찾고 부모 노드가 그 위치를 물리 순서로 정렬해 테이블을 읽는 두 단계이며, 문서의 예에서는 테이블의 모든 페이지를 읽지 않아도 되므로 순차 스캔보다 싸다고 설명한다. 11.9는 index-only scan이 힙 접근 없이 인덱스만으로 답하는 방식이고 인덱스 타입이 지원해야 하며 쿼리가 인덱스에 있는 컬럼만 참조해야 한다고 한다.
(실험 확인) 행 20만 개 `orders`(PostgreSQL 16.15)에서 `user_id = 777`(101행)은 Index Scan이 아니라 Bitmap Heap Scan(`Heap Blocks: exact=100`)이었고, `ORDER BY id DESC LIMIT 5`는 Index Scan Backward, `created_at` 두 시간 범위(60행)는 Index Scan이었다. `user_id` 인덱스에 `INCLUDE (amount)`를 붙이고 VACUUM한 `ord2` 테이블에서 `SELECT amount WHERE user_id = 777`은 `Index Only Scan`에 `Heap Fetches: 0`이었다. 같은 컬럼 조건이라도 맞는 행 수와 열 구성에 따라 노드가 달라진다는 것을 보여 준다.
