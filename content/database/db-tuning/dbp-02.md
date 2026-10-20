---
slug: "dbp-02"
topic: "db-tuning"
tier: BASIC
difficulty: 1
title: "EXPLAIN 출력의 cost, rows, width 숫자는 어떻게 읽나요?"
keywords: ["시작 비용과 총 비용", "임의 단위", "내보내는 행 수 추정", "자식 노드 비용 포함"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/runtime-config-query.html"]
concepts: [query-planner]
importance: 2
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 `cost=0.00..11819.00 rows=500000 width=72`에서 앞 숫자는 첫 행을 내보내기 전까지의 시작 비용이고 뒤 숫자는 모든 행을 가져올 때까지의 총 비용입니다. rows는 그 노드가 내보낼 것으로 추정한 행 수이고 width는 행의 평균 바이트 수입니다. 비용은 밀리초가 아니라 플래너 비용 파라미터로 정해지는 임의 단위라서 시간과 직접 비교할 수 없고 같은 쿼리의 후보 계획끼리 비교하는 데 쓰입니다. 상위 노드의 비용은 자식 노드 비용을 포함하며, rows는 스캔한 행이 아니라 필터를 통과해 나가는 행입니다. 실제로 맞는지는 ANALYZE의 actual 값과 견줘 봐야 합니다.

```sql
SELECT relpages*1.0 + reltuples*0.01 AS expected_seq_cost
FROM pg_class WHERE relname = 'orders';  -- 11819
EXPLAIN SELECT * FROM orders;
-- Seq Scan on orders  (cost=0.00..11819.00 rows=500000 width=72)
```

(공식 문서) Using EXPLAIN 페이지는 괄호 안 숫자가 시작 비용, 총 비용, 추정 행 수, 평균 행 너비라고 설명하고, 비용은 플래너 비용 파라미터가 정하는 임의 단위이며 관례적으로 seq_page_cost를 1.0으로 둔다고 한다. 순차 스캔 비용은 (읽는 페이지 수 × seq_page_cost) + (스캔하는 행 수 × cpu_tuple_cost)로 계산되고 기본값은 1.0과 0.01이다. 상위 노드의 비용이 자식 비용을 포함하며, 클라이언트로 결과를 보내는 시간은 비용에 들어가지 않고, rows는 처리한 행이 아니라 노드가 내보내는 행이라고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 orders 테이블에서 relpages=6819, reltuples=500000이고 위 식의 결과 11819가 EXPLAIN의 총 비용 11819.00과 같았다.
