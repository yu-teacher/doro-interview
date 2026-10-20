---
slug: "dbi-20"
topic: "db-index"
tier: TRICKY
difficulty: 3
title: "ORDER BY ... LIMIT 쿼리를 인덱스로 처리하려면 인덱스를 어떻게 설계해야 하나요(ASC·DESC가 섞인 경우 포함)?"
keywords: ["정렬된 인덱스 스캔", "LIMIT 조기 종료", "역방향 스캔", "ASC·DESC 혼합 인덱스", "별도 정렬 생략"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-ordering.html", "https://www.postgresql.org/docs/16/indexes-multicolumn.html", "https://dev.mysql.com/doc/refman/8.4/en/descending-indexes.html"]
---
**모범 답변 (30~60초)**
B-tree 인덱스는 정렬되어 저장되므로 ORDER BY와 순서가 맞으면 별도 정렬 없이 앞에서부터 n행만 읽고 멈출 수 있어서, ORDER BY와 LIMIT이 함께 있을 때 가장 큰 이득이 있습니다. PostgreSQL 16의 기본 인덱스는 오름차순 NULLS LAST로 저장되고 역방향 스캔으로 DESC도 처리하므로, 같은 방향이거나 전부 반대 방향이면 인덱스를 따로 만들 필요가 없습니다. 하지만 ORDER BY x ASC, y DESC처럼 컬럼마다 방향이 섞이면 (x ASC, y DESC) 인덱스가 필요합니다. 많은 행을 읽어야 하면 정렬이 더 빠를 수도 있어서 계획을 확인합니다. MySQL 8.4(InnoDB)도 DESC 인덱스를 지원합니다.

```sql
CREATE INDEX orders_u_asc_c_desc ON orders (user_id ASC, created_at DESC);
SELECT user_id, created_at FROM orders
WHERE user_id < 3 ORDER BY user_id ASC, created_at DESC LIMIT 5;
```

(공식 문서) PostgreSQL 11.4는 인덱스가 정렬된 출력을 내면 ORDER BY에 별도 정렬이 필요 없고, 많은 행을 읽는 쿼리는 명시적 정렬이 더 빠를 수 있지만 ORDER BY와 LIMIT n이 함께면 일치하는 인덱스로 처음 n행만 읽고 나머지는 스캔하지 않아도 된다고 한다. 기본 저장은 오름차순 NULLS LAST이고 역방향 스캔이 DESC NULLS FIRST를 만족한다. `(x, y)` 인덱스는 순방향이면 `ORDER BY x, y`, 역방향이면 `ORDER BY x DESC, y DESC`를 만족하지만 `ORDER BY x ASC, y DESC`는 `(x ASC, y DESC)`처럼 만든 인덱스만 가능하다고 한다. MySQL 8.4 Descending Indexes 문서는 `DESC`가 키 값을 내림차순으로 저장하며 컬럼별로 방향이 섞인 `ORDER BY`에 필요한 filesort를 피하게 해 준다고 한다(InnoDB 한정).
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `(user_id, created_at)` 인덱스로 `WHERE user_id = 777 ORDER BY created_at DESC LIMIT 10`은 Sort 없이 Index Scan Backward(버퍼 13개)였다. `WHERE user_id < 3 ORDER BY user_id ASC, created_at DESC LIMIT 5`는 이 인덱스로 Index Only Scan 위에 `Incremental Sort`(Presorted Key: user_id)가 붙었고, `(user_id ASC, created_at DESC)` 인덱스를 만들자 정렬 노드가 사라지고 Limit 아래 Index Only Scan만 남았다. MySQL 8.4.11에서 같은 형태의 쿼리는 `(user_id ASC, created_at ASC)` 인덱스에서 `Using filesort`가 나왔고 `(user_id ASC, created_at DESC)` 인덱스에서는 filesort 없이 `idx_d`를 사용했다. `WHERE user_id = 777 ORDER BY created_at DESC LIMIT 10`은 MySQL에서 `Backward index scan`이었다.
