---
slug: "dbs-07"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "COUNT(*), COUNT(컬럼), COUNT(DISTINCT 컬럼)은 어떻게 다른가요?"
keywords: ["COUNT(*)는 행 수", "COUNT(컬럼)은 NULL 제외", "COUNT(DISTINCT)는 중복 제거", "집계 함수는 NULL 무시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/functions-aggregate.html", "https://www.postgresql.org/docs/16/sql-expressions.html", "https://dev.mysql.com/doc/refman/8.4/en/problems-with-null.html"]
---
**모범 답변 (30~60초)**
COUNT(*)는 NULL 여부와 상관없이 입력 행의 수를 셉니다. COUNT(컬럼)은 그 컬럼 값이 NULL이 아닌 행만 세고, COUNT(DISTINCT 컬럼)은 NULL이 아닌 값 중 서로 다른 값의 개수를 셉니다. 대부분의 집계 함수가 NULL을 무시하고 COUNT(*)만 행 자체를 센다는 점이 핵심입니다. 그래서 NULL이 많은 컬럼에 COUNT(컬럼)을 쓰면 전체 행 수보다 작게 나오고, AVG도 NULL 행을 빼고 평균을 냅니다. PostgreSQL 16 기준이며 MySQL 8.4에서도 같습니다.

(공식 문서) PostgreSQL 16 functions-aggregate 페이지는 `count(*)`가 입력 행 수이고 `count(expr)`는 값이 NULL이 아닌 입력 행 수라고 정의한다. sql-expressions 페이지는 대부분의 집계 함수가 NULL 입력을 무시하고, `count(distinct f1)`이 f1의 NULL이 아닌 서로 다른 값의 개수라고 설명한다. MySQL 8.4 problems-with-null 페이지는 COUNT, MIN, SUM 같은 집계가 NULL을 무시하고 COUNT(*)만 행을 센다고 설명한다.
(실험 확인) 7행 `emp`(bonus는 4행 NULL, 값은 100, 50, 10 / dept는 2행 NULL, 값은 dev, sales)에서 `count(*)` 7, `count(bonus)` 3, `count(DISTINCT bonus)` 3, `count(dept)` 5, `count(DISTINCT dept)` 2였다. `avg(bonus)`는 53.33, NULL을 0으로 바꾼 `avg(COALESCE(bonus, 0))`는 22.86이었다. PostgreSQL 16.15와 MySQL 8.4.11이 같았다.
