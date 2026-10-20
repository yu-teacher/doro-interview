---
slug: "dbp-20"
topic: "db-tuning"
tier: TRICKY
difficulty: 3
title: "쿼리에 LIMIT을 붙였더니 오히려 훨씬 느려지는 경우가 있는 이유는 무엇인가요?"
keywords: ["LIMIT을 반영한 비용 비교", "인덱스 순서로 훑다 멈춤", "Rows Removed by Filter", "조건 일치 행이 한쪽에 몰림", "복합 인덱스로 해결"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/indexes-ordering.html"]
concepts: [query-planner, index-design]
importance: 1
links: [{to: "dbp-09", kind: PREREQ}, {to: "dbi-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 LIMIT이 있으면 플래너는 앞의 몇 행만 필요하다고 보고 전체가 아니라 일부 비용으로 계획을 비교합니다. 그래서 ORDER BY ts LIMIT 1이면 ts 인덱스를 순서대로 훑다가 조건에 맞는 첫 행에서 멈추는 계획이 싸 보일 수 있습니다. 그런데 조건에 맞는 행이 인덱스 순서의 뒤쪽에 몰려 있으면 그 앞의 행을 전부 읽고 필터로 버려야 해서, LIMIT이 없는 쿼리보다 훨씬 느려질 수 있습니다. EXPLAIN ANALYZE에서 Rows Removed by Filter가 크면 이 경우를 의심하고, (flag, ts) 같은 복합 인덱스로 필터와 정렬을 한꺼번에 만족시키는 식으로 해결합니다.

```sql
CREATE INDEX ev_flag_ts ON ev (flag, ts);
EXPLAIN (ANALYZE) SELECT * FROM ev WHERE flag = 'hot' ORDER BY ts LIMIT 1;
-- Index Scan using ev_flag_ts ... (Index Cond: flag = 'hot')  실행 0.042ms
```

(공식 문서) Using EXPLAIN의 LIMIT 예는 LIMIT이 있으면 하위 노드의 비용이 전부 실행되는 것처럼 표시되지만 Limit 노드는 일부 행만 받고 멈추므로 총비용이 그만큼 줄어든다고 하고, 이 때문에 LIMIT을 붙이면 플래너가 계획을 바꾼다고 한다. 추정은 실제와 다를 수 있다는 Caveats도 함께 본다. Indexes and ORDER BY 절은 ORDER BY와 LIMIT n이 함께일 때 ORDER BY와 맞는 인덱스가 있으면 첫 n행을 나머지를 스캔하지 않고 가져올 수 있다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 테이블 ev(ts는 ev_ts 인덱스, flag='hot'은 ts가 가장 큰 5,000행, ev_flag 인덱스 있음, VACUUM ANALYZE 후). `WHERE flag='hot' ORDER BY ts LIMIT 1`은 `Index Scan using ev_ts` + `Filter: flag = 'hot'`에 `Rows Removed by Filter: 495000`, 실행 26.6~28.2ms, 버퍼 7,467개였다. Limit 노드의 비용 5.05는 Index Scan의 추정 총비용 20422.42를 추정 행 수 4,417로 나눈 값에 시작 비용 0.42를 더한 값(약 5.04)과 맞아서, 조건에 맞는 행이 인덱스 순서 전체에 고르게 퍼져 있다고 보고 비용을 비례 배분한 것으로 읽힌다. LIMIT 없이 ORDER BY ts만 하면 ev_flag 인덱스와 Sort로 0.76~0.82ms였다. (flag, ts) 인덱스를 만든 뒤에는 LIMIT 1이 0.040~0.042ms였다. 수치는 이 데이터·버전에서의 값이다.
(보충) 플래너가 조건에 맞는 행이 인덱스 순서 전체에 고르게 퍼져 있다고 가정하기 때문이라는 설명은 일반적 설명이며, 읽은 공식 문서에서 이 가정을 직접 서술한 문장은 확인하지 못했다. 위 비용 산식 일치는 이 가정과 모순되지 않는다는 정도의 관찰이다.
