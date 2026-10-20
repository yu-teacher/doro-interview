---
slug: "dbi-04"
topic: "db-index"
tier: BASIC
difficulty: 2
title: "복합(다중 컬럼) 인덱스의 컬럼 순서는 어떻게 정하나요?"
keywords: ["선두 컬럼 조건", "등호 컬럼 먼저 범위 컬럼 나중", "스캔 범위 제한 규칙", "정렬 순서까지 해결", "세 개 넘는 컬럼은 신중히"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-multicolumn.html", "https://www.postgresql.org/docs/16/indexes-ordering.html"]
---
**모범 답변 (30~60초)**
다중 컬럼 B-tree 인덱스는 왼쪽, 즉 선두 컬럼부터 정렬되어 있어서, 선두 컬럼들의 등호 조건과 그다음 첫 번째 범위 조건까지가 인덱스에서 훑는 구간을 좁혀 줍니다. 그래서 보통 등호로 비교하는 컬럼을 앞에, 범위 조건이나 정렬에 쓰는 컬럼을 뒤에 둡니다. user_id가 같고 created_at이 범위인 조회라면 (user_id, created_at)입니다. 이 인덱스는 user_id 조건에 created_at 정렬과 LIMIT이 붙은 쿼리도 별도 정렬 없이 처리할 수 있습니다. 공식 문서는 컬럼이 세 개를 넘는 인덱스는 테이블 사용 방식이 매우 정형화되어 있지 않으면 도움이 되기 어렵다고 하니 신중히 만들어야 합니다.

```sql
CREATE INDEX orders_u_c ON orders (user_id, created_at);
SELECT * FROM orders
WHERE user_id = 777 AND created_at >= '2026-06-01' AND created_at < '2026-07-01';
```

(공식 문서) 11.3은 다중 컬럼 B-tree 인덱스가 컬럼의 어떤 부분집합에 대한 조건에도 쓰일 수 있지만 선두(가장 왼쪽) 컬럼에 제약이 있을 때 가장 효율적이라고 한다. 정확한 규칙은 선두 컬럼들의 등호 조건과, 등호가 없는 첫 컬럼에 대한 부등호 조건이 스캔할 인덱스 범위를 제한하고, 그 오른쪽 컬럼의 조건은 인덱스 안에서 검사되어 힙 방문은 줄이지만 스캔 범위는 줄이지 못한다는 것이다. 문서는 `(a, b, c)` 인덱스에서 `a = 5 AND b >= 42 AND c < 77`이면 `a = 5, b = 42`인 첫 항목부터 `a = 5`의 마지막 항목까지 훑는다는 예를 든다. 또 컬럼이 세 개를 넘는 인덱스는 테이블 사용이 극히 정형화되어 있지 않으면 도움이 되기 어렵다고 한다. 11.4는 `(x, y)` 인덱스가 순방향이면 `ORDER BY x, y`, 역방향이면 `ORDER BY x DESC, y DESC`를 만족한다고 한다.
(실험 확인) 행 20만 개 `orders`(PostgreSQL 16.15)에 `(user_id, created_at)` 인덱스를 두고 위 쿼리를 실행하면 `Index Cond`에 세 조건이 모두 들어가 6행을 버퍼 9개로 찾았다(Bitmap Index Scan, 0.039 ms). 같은 인덱스로 `WHERE user_id = 777 ORDER BY created_at DESC LIMIT 10`을 실행하면 Sort 노드 없이 Index Scan Backward(버퍼 13개)였다. `(created_at, user_id)`와 `(user_id, created_at)` 인덱스 크기는 6,176 kB와 6,184 kB로 거의 같았다.
(보충) 등호 컬럼을 앞, 범위 컬럼을 뒤에 두라는 지침은 위 스캔 범위 규칙에서 이끌어 낸 일반 가이드이며 문서가 순서를 그렇게 처방한 것은 아니다. 또 `user_id` 등호 조건에 `created_at` 정렬과 LIMIT을 붙인 쿼리가 별도 정렬 없이 처리된다는 것은 11.4의 정렬 설명을 이 경우에 적용해 실험으로 확인한 것이며 문서가 이 예를 직접 들지는 않는다.
