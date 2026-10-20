---
slug: "dbi-07"
topic: "db-index"
tier: BASIC
difficulty: 2
title: "인덱스가 있는 컬럼으로 조회하는데도 PostgreSQL이 Seq Scan을 선택하는 이유는 무엇인가요?"
keywords: ["비용 기반 선택", "조건에 맞는 행 비율이 큼", "순차 읽기가 더 쌈", "작은 테이블", "통계가 오래됨"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-examine.html", "https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/indexes-partial.html", "https://www.postgresql.org/docs/16/planner-stats.html", "https://www.postgresql.org/docs/16/runtime-config-query.html"]
concepts: [query-planner, index-design]
importance: 3
links: [{to: "dbi-12", kind: FOLLOWUP}, {to: "dbi-19", kind: FOLLOWUP}, {to: "dbp-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
플래너는 인덱스가 있는지가 아니라 계획별 예상 비용을 비교해서 가장 싼 계획을 고르기 때문입니다. 조건에 맞는 행이 테이블의 큰 비율이면 인덱스를 거쳐 힙을 여기저기 읽는 것보다 순차로 전부 읽는 쪽이 싸서 Seq Scan이 선택됩니다. 테이블이 몇 페이지 안 되는 아주 작은 경우도 마찬가지입니다. 통계가 오래되어 행 수 추정이 틀려도 엉뚱한 계획이 나올 수 있어서, 먼저 ANALYZE를 하고 enable_seqscan을 꺼서 인덱스 계획을 강제로 만든 다음 계획 비용과 실제 시간을 비교해 보는 것이 공식 문서가 권하는 점검 순서입니다.

(공식 문서) 11.12는 인덱스를 점검할 때 항상 ANALYZE를 먼저 하고, 실제 데이터를 쓰고, 100행 중 1행을 고르는 정도의 작은 테이블에는 인덱스가 거의 소용없다고 한다(전체가 한 페이지에 들어가므로). 인덱스가 안 쓰이면 `enable_seqscan` 등으로 순차 스캔을 꺼서 인덱스 계획을 만들어 보고, 그것이 정말 더 빠른지 EXPLAIN ANALYZE로 시간을 비교하며, 비용 추정이 틀렸다면 `random_page_cost` 같은 비용 파라미터나 통계 설정을 조정하라고 한다. 14.1은 행을 따로따로 가져오는 것이 순차로 읽는 것보다 훨씬 비싸다고 설명하고, 11.8은 전체 행의 몇 퍼센트를 넘는 흔한 값을 찾는 쿼리는 어차피 인덱스를 쓰지 않는다고 한다.
(실험 확인) 행 20만 개 `orders`(PostgreSQL 16.15)에서 전체의 약 95%인 `status = 'DONE'`(189,945행)은 `status` 인덱스가 있어도 Seq Scan(8.578 ms)이었다. `enable_seqscan = off`로 강제하니 Bitmap Heap Scan(8.751 ms)이었고, 예상 총 비용은 Seq Scan 4,939.00, 인덱스 계획 6,940.27이어서 플래너는 더 싼 쪽을 고른 것이다. 두 시간은 같은 자릿수라 인덱스 계획이 느리다고 단정하지는 않는다. 약 1%인 `status = 'NEW'`(2,021행)는 `status` 단일 인덱스만 있을 때 Index Scan이었다. 기본 키가 있는 100행 테이블의 `id = 5`는 ANALYZE 후에도 Seq Scan이었다. 또 100행으로 ANALYZE한 테이블에 20만 행을 추가하고 통계를 갱신하지 않은 채 실제 100행인 `k = 1`을 조회하자 예상 88,600행으로 Seq Scan(4.854 ms)이 나왔고, ANALYZE 후에는 예상 133행으로 Index Scan(0.020 ms)이 되었다.
