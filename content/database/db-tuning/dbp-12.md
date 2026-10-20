---
slug: "dbp-12"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "복합 인덱스에서 컬럼 순서는 어떻게 정하나요?"
keywords: ["왼쪽 컬럼부터 사용", "등치 조건 앞", "범위 조건 뒤", "인덱스 순서로 ORDER BY 처리", "뒤 컬럼 단독 조건 비효율"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-multicolumn.html", "https://www.postgresql.org/docs/16/indexes-ordering.html", "https://www.postgresql.org/docs/current/indexes-multicolumn.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 B-tree 복합 인덱스는 왼쪽 컬럼부터 차례로 쓰입니다. 앞 컬럼에 등치 조건이 있고, 그 다음 컬럼에 부등호 조건이 있으면 그 범위까지가 인덱스에서 스캔할 범위를 좁히고, 그보다 오른쪽 컬럼 조건은 인덱스 안에서 검사만 합니다. 그래서 (a, b) 인덱스는 a만 있거나 a와 b가 함께 있는 조건에는 잘 쓰이지만 b만 있는 조건에는 인덱스 전체를 훑어야 해서 보통 순차 스캔이 선택됩니다. 보통 등치로 자주 비교하는 컬럼을 앞에, 범위나 정렬에 쓰는 컬럼을 뒤에 둡니다. 예를 들어 WHERE customer_id = ? ORDER BY created_at DESC LIMIT 5는 (customer_id, created_at) 인덱스로 별도 정렬 없이 처리됩니다.

```sql
CREATE INDEX o2_cust_created ON o2 (customer_id, created_at);
SELECT id, created_at FROM o2 WHERE customer_id = 77 ORDER BY created_at DESC LIMIT 5;
-- Index Scan Backward using o2_cust_created (Sort 노드 없음)
```

(공식 문서) Multicolumn Indexes 절은 B-tree 복합 인덱스가 컬럼의 어떤 부분집합 조건에도 쓰일 수 있지만 선행 컬럼에 제약이 있을 때 가장 효율적이며, 정확한 규칙은 선행 컬럼의 등치 조건과 첫 번째 비등치 컬럼의 부등호 조건이 스캔 범위를 제한하고 그 오른쪽 컬럼 조건은 인덱스 안에서 검사되어 테이블 방문만 줄인다고 한다. a 조건 없이 b, c만 있는 조건은 인덱스 전체를 훑어야 해서 대개 순차 스캔이 낫다고 한다. 버전 차이로, 현재 버전(18) 문서에는 선행 컬럼의 고유값이 적을 때 B-tree 스캔이 skip scan 최적화를 적용할 수 있다고 적혀 있어 이 답변의 해당 설명은 16 기준이다(16에서 skip scan은 실험하지 않았다). Indexes and ORDER BY 절은 B-tree만 정렬된 출력을 낼 수 있고 인덱스를 거꾸로 스캔해 DESC도 만족하며, ORDER BY와 LIMIT이 함께일 때 인덱스가 ORDER BY와 맞으면 첫 n행만 바로 가져올 수 있다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 테이블 o2에 (customer_id, created_at) 인덱스를 두고, `customer_id = 77 ORDER BY created_at DESC LIMIT 5`는 Sort 없이 Index Scan Backward였다. `created_at` 단독 등치는 Seq Scan이었고, `customer_id < 50 ORDER BY created_at LIMIT 5`는 Bitmap Heap Scan 위에 top-N heapsort가 필요했다. 인덱스를 (created_at, customer_id)로 바꾼 뒤 `customer_id = 77`은 Seq Scan이었다.
(보충) 등치 컬럼을 앞에, 범위·정렬 컬럼을 뒤에 둔다는 요령은 위 공식 규칙을 실무에 적용한 일반 가이드이며, 컬럼의 고유값 수(선택도)까지 고려한 순서 결정은 쿼리 패턴마다 달라서 문서가 일률적으로 정해 주지 않는다.
