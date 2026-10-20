---
slug: "dbs-09"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "SQL은 어떤 순서로 처리되고, 그래서 WHERE에서 SELECT 별칭을 못 쓰는 이유는 무엇인가요?"
keywords: ["FROM, WHERE, GROUP BY, HAVING 순서", "SELECT 이후 DISTINCT와 ORDER BY", "WHERE에서 별칭 불가", "ORDER BY는 별칭 가능", "논리적 순서와 실제 실행은 다름"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-table-expressions.html", "https://www.postgresql.org/docs/16/queries-select-lists.html", "https://www.postgresql.org/docs/16/queries-order.html", "https://www.postgresql.org/docs/16/tutorial-window.html", "https://www.postgresql.org/docs/16/sql-select.html", "https://dev.mysql.com/doc/refman/8.4/en/problems-with-alias.html", "https://dev.mysql.com/doc/refman/8.4/en/select.html"]
---
**모범 답변 (30~60초)**
논리적으로는 FROM과 JOIN으로 행을 만들고, WHERE로 행을 거르고, GROUP BY로 묶고, HAVING으로 그룹을 거른 다음 SELECT 목록을 계산하고, 이어서 DISTINCT, ORDER BY, LIMIT을 적용한다고 이해합니다. SELECT 목록이 WHERE보다 뒤라서 PostgreSQL 16 기준으로 WHERE에서 SELECT 별칭을 쓰면 그런 컬럼이 없다는 오류가 나고, ORDER BY는 SELECT 뒤라 별칭을 쓸 수 있습니다. 같은 이유로 집계 함수와 윈도 함수는 WHERE에 쓸 수 없습니다. 다만 이는 의미상의 순서이고 실제 실행 계획은 결과가 같은 범위에서 다르게 짤 수 있으며, MySQL 8.4는 HAVING에서 별칭을 허용하는 등 확장이 있습니다.

```sql
SELECT sal*2 AS dbl FROM emp WHERE dbl > 9000;      -- 오류 (WHERE가 SELECT 목록보다 먼저)
SELECT id, sal*2 AS dbl FROM emp ORDER BY dbl DESC;  -- 가능 (ORDER BY가 나중)
```

(공식 문서) PostgreSQL 16 queries-table-expressions 페이지는 WHERE, GROUP BY, HAVING이 FROM 결과에 연속 적용되는 변환 파이프라인이고 그 결과가 select list로 넘어간다고 설명한다. queries-select-lists 페이지는 DISTINCT가 select list 처리 뒤에 적용된다고 하고, queries-order 페이지는 ORDER BY가 출력 테이블 뒤에 적용되며 출력 컬럼 이름을 쓸 수 있지만 식 안에서는 쓸 수 없다고 한다. tutorial-window 페이지는 윈도 함수가 WHERE, GROUP BY, HAVING 뒤에 실행되어 그 절에서 금지된다고 한다. sql-select 페이지는 표준상 출력식이 DISTINCT, ORDER BY, LIMIT 전에 계산된다고 적는다. MySQL 8.4 problems-with-alias 페이지는 별칭을 GROUP BY, ORDER BY, HAVING에서 쓸 수 있고 표준 SQL은 WHERE의 별칭 참조를 금지한다고 하며, select 페이지는 표준이 HAVING에 GROUP BY 컬럼이나 집계 컬럼만 허용하지만 MySQL은 SELECT 목록 컬럼도 참조하도록 확장했다고 설명한다.
(실험 확인) PostgreSQL 16.15에서 `WHERE dbl`과 `HAVING s`는 `column ... does not exist` 오류였고 `ORDER BY dbl`은 성공, `ORDER BY dbl + 1`은 오류였다. MySQL 8.4.11은 `WHERE` 별칭은 오류(1054)였지만 `HAVING s > 9000`과 `ORDER BY dbl + 1`은 성공했다.
(보충) 옵티마이저가 의미를 보존하는 한 실행 순서를 바꿀 수 있다는 설명은 일반 설명이며 이번에 읽은 문서 구절로 확인한 것은 아니다.
