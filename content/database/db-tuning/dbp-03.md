---
slug: "dbp-03"
topic: "db-tuning"
tier: BASIC
difficulty: 2
title: "Seq Scan, Index Scan, Bitmap Scan, Index Only Scan은 각각 어떤 방식이고 언제 선택되나요?"
keywords: ["테이블 전체 순차 읽기", "인덱스 순서로 행 접근", "비트맵으로 물리 순서 읽기", "인덱스만으로 응답", "선택도와 비용 비교"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/indexes-bitmap-scans.html", "https://www.postgresql.org/docs/16/indexes-index-only-scans.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 Seq Scan은 테이블을 처음부터 끝까지 순서대로 읽는 방식이고, Index Scan은 인덱스로 위치를 찾아 행을 인덱스 순서대로 가져오는 방식이라 한두 행을 찾거나 ORDER BY와 인덱스 순서가 맞을 때 주로 나옵니다. Bitmap Scan은 인덱스로 일치하는 위치를 모아 비트맵을 만든 뒤 테이블을 물리적 순서로 읽어서, 중간 정도 개수의 행을 가져오거나 여러 인덱스를 AND, OR로 합칠 때 쓰입니다. Index Only Scan은 필요한 컬럼이 모두 인덱스에 있고 가시성 맵으로 확인되면 테이블을 읽지 않고 인덱스만으로 답합니다. 어느 방식이 나오는지는 조건의 선택도와 플래너의 비용 비교로 정해집니다.

```sql
EXPLAIN SELECT * FROM orders WHERE id = 42;                    -- Index Scan
EXPLAIN SELECT * FROM orders WHERE customer_id = 77;           -- Bitmap Heap Scan
EXPLAIN SELECT * FROM orders WHERE status = 'PAID';            -- Seq Scan (약 70%)
EXPLAIN SELECT customer_id FROM orders WHERE customer_id = 77; -- Index Only Scan
```

(공식 문서) Using EXPLAIN 페이지는 스캔 노드 종류를 순차·인덱스·비트맵 스캔으로 나누고, 비트맵 방식은 인덱스가 찾은 행 위치를 물리 순서로 정렬해 읽어 임의 접근 비용을 줄인다고 설명하며(예시에서 1만 행 중 100행 조건이 비트맵 스캔으로 나온다), 단순 Index Scan은 행이 거의 없거나 ORDER BY가 인덱스 순서와 맞을 때 자주 쓰인다고 한다. Combining Multiple Indexes 절은 여러 인덱스의 비트맵을 AND/OR로 합치고 이 경우 인덱스의 정렬 순서가 사라져 ORDER BY에는 별도 정렬이 필요하다고 한다. Index-Only Scans 절은 인덱스가 값을 저장하고 질의가 인덱스 컬럼만 참조해야 하며, 가시성 맵으로 행이 모두에게 보이는지 확인되는 경우에만 힙 접근을 생략한다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 orders 테이블(PK, customer_id·created_at·status 인덱스, VACUUM ANALYZE 후)에서 위 네 쿼리는 각각 Index Scan, Bitmap Heap Scan(50행), Seq Scan(34만 9,500행, Rows Removed by Filter 15만 500), Index Only Scan(Heap Fetches 0)이 나왔다. customer_id < 300(1만 4,950행)도 Bitmap Heap Scan이었고 힙 페이지 6,700개(테이블 6,819페이지)를 읽었다. 같은 customer_id=77인데 Index Scan이 아니라 Bitmap이 나온 것은 이 컬럼 값이 물리 위치에 흩어져 있기 때문으로 보이며, 이 데이터와 버전에서의 결과다.
