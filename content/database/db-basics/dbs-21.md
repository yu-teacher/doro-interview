---
slug: "dbs-21"
topic: "db-basics"
tier: TRICKY
difficulty: 3
title: "ORDER BY에서 NULL은 어디에 정렬되나요? PostgreSQL과 MySQL이 다른가요?"
keywords: ["PostgreSQL은 NULL을 가장 큰 값으로", "ASC면 NULLS LAST", "MySQL은 NULL이 먼저", "NULLS FIRST·LAST 명시", "GROUP BY는 NULL을 한 그룹으로"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-order.html", "https://dev.mysql.com/doc/refman/8.4/en/problems-with-null.html", "https://www.postgresql.org/docs/16/queries-select-lists.html"]
concepts: [null-handling]
importance: 1
links: [{to: "dbs-04", kind: PREREQ}, {to: "dbi-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16은 기본적으로 NULL을 모든 값보다 큰 값처럼 취급해서 오름차순이면 맨 뒤, 내림차순이면 맨 앞에 옵니다. `NULLS FIRST`나 `NULLS LAST`로 위치를 직접 정할 수 있습니다. MySQL 8.4는 반대로 NULL을 가장 작은 값처럼 취급해 오름차순이면 맨 앞, 내림차순이면 맨 뒤에 옵니다. 같은 정렬 쿼리를 두 DB에서 돌리면 NULL 위치가 달라지고 MySQL 8.4에서는 `NULLS LAST` 문법이 되지 않았으므로, 위치가 중요하면 `ORDER BY col IS NULL, col`처럼 DB에 의존하지 않게 씁니다. 한편 GROUP BY와 DISTINCT는 두 DB 모두 NULL들을 하나로 묶습니다.

| `ORDER BY dept` (dept: dev, sales, NULL) | ASC | DESC |
|---|---|---|
| PostgreSQL 16.15 | dev, sales, NULL | NULL, sales, dev |
| MySQL 8.4.11 | NULL, dev, sales | sales, dev, NULL |

(공식 문서) PostgreSQL 16 queries-order 페이지는 NULL이 기본적으로 모든 값보다 큰 것처럼 정렬되어 `NULLS FIRST`가 DESC의 기본, `NULLS LAST`가 그 외의 기본이며 정렬 옵션을 직접 줄 수 있다고 설명한다. queries-select-lists 페이지는 DISTINCT가 NULL들을 같다고 본다고 한다. MySQL 8.4 problems-with-null 페이지는 DISTINCT, GROUP BY, ORDER BY에서 NULL이 모두 같다고 보고, ORDER BY에서 NULL이 먼저 나오고 DESC이면 마지막에 나온다고 설명한다.
(실험 확인) `SELECT dept FROM emp GROUP BY dept ORDER BY dept`(NULL 부서가 2행)에서 위 표와 같은 순서가 나왔고 `GROUP BY dept`로 NULL 2행은 한 그룹으로 묶였다. MySQL 8.4.11에서 `ORDER BY dept NULLS LAST`는 문법 오류(1064)였고 `ORDER BY dept IS NULL, dept`는 dev, sales, NULL 순으로 동작했다. PostgreSQL 16.15에서 `NULLS LAST`는 동작했다.
