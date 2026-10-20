---
slug: "dbp-11"
topic: "db-tuning"
tier: DEEP
difficulty: 3
title: "선택도가 비슷한데 Index Scan과 Bitmap Scan이 갈리는 기준은 무엇인가요?"
keywords: ["물리적 순서와 인덱스 순서의 상관", "correlation", "임의 접근 비용", "페이지 중복 방문 방지", "정렬 순서 손실"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/indexes-bitmap-scans.html", "https://www.postgresql.org/docs/16/view-pg-stats.html", "https://www.postgresql.org/docs/16/runtime-config-query.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 Index Scan은 인덱스 순서대로 힙 행을 하나씩 가져오므로, 행의 물리적 위치가 인덱스 순서와 비슷하면 가까운 페이지를 이어서 읽어 싸고, 흩어져 있으면 임의 접근이 늘어 비쌉니다. 그 정도를 pg_stats의 correlation(-1에서 +1, 0에 가까우면 흩어짐)이 알려 줍니다. Bitmap Scan은 일치하는 위치를 먼저 모아 물리 순서로 읽기 때문에 같은 페이지를 여러 번 오가지 않아, 흩어진 데이터에서 중간 정도 선택도에 유리하지만 인덱스의 정렬 순서는 잃습니다. 그래서 같은 5천 행 조회라도 정렬된 컬럼은 Index Scan, 뒤섞인 컬럼은 Bitmap Scan이 나올 수 있습니다.

```sql
SELECT attname, correlation FROM pg_stats WHERE tablename = 'orders';
-- id: 1, created_at: 1, customer_id: 0에 가까움(-0.01 안팎)
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE id BETWEEN 1000 AND 6000;  -- Index Scan
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE customer_id < 100;         -- Bitmap Heap Scan
```

(공식 문서) pg_stats의 correlation은 물리적 행 순서와 컬럼 값 논리 순서 사이의 통계적 상관으로 -1~+1이며, 절댓값이 1에 가까우면 디스크 임의 접근이 줄어 인덱스 스캔이 더 싸게 추정된다고 한다. Using EXPLAIN은 비트맵 방식이 행 위치를 물리 순서로 정렬해 읽는다고, Combining Multiple Indexes는 이 때문에 인덱스 정렬 순서가 사라져 ORDER BY에는 별도 정렬이 필요하다고 한다. random_page_cost 문서는 이 값을 낮추면 인덱스 스캔을 선호하게 된다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 orders(VACUUM ANALYZE 후). `id BETWEEN 1000 AND 6000`(5,001행)은 Index Scan으로 버퍼 89개를 접근했고, `customer_id < 100`(4,950행)은 Bitmap Heap Scan으로 Heap Blocks exact=3510, 버퍼 3,524개였다. 같은 id 범위를 enable_indexscan=off로 비트맵으로 강제하면 Heap Blocks 69, 버퍼 86개로 비슷했다. 흩어진 컬럼의 비트맵을 끄면 Index Scan이 아니라 Seq Scan(버퍼 6,819)이 나왔다. 비트맵 계획에 `ORDER BY customer_id`를 붙이면 계획 위에 Sort 노드가 추가되었다.
(보충) 흩어진 데이터에서 Index Scan이 같은 힙 페이지를 여러 번 읽을 수 있고, 그래서 비트맵 스캔이 흩어진 데이터의 중간 정도 선택도에 유리하다는 설명은 동작 원리에 대한 일반적 설명이며, 위 실험에서 Index Scan의 중복 방문 횟수를 직접 세지는 않았다. correlation 값은 ANALYZE의 표본마다 조금씩 달라진다(이번 재실행에서는 customer_id가 약 -0.01).
