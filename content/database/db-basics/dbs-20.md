---
slug: "dbs-20"
topic: "db-basics"
tier: TRICKY
difficulty: 3
title: "윈도 함수에 ORDER BY를 넣으면 sum이 누적합이 되고 동점 행은 같은 값이 나온다던데 왜 그런가요?"
keywords: ["ORDER BY가 있으면 프레임이 처음부터 현재까지", "동순위 행 포함", "ORDER BY 없으면 파티션 전체", "고유 정렬 키 또는 ROWS 프레임"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/tutorial-window.html", "https://www.postgresql.org/docs/16/sql-expressions.html"]
---
**모범 답변 (30~60초)**
윈도 프레임을 따로 지정하지 않으면, OVER에 ORDER BY가 있을 때 기본 프레임은 파티션 처음부터 현재 행까지에 현재 행과 정렬 값이 같은 뒤쪽 행까지 포함한 범위입니다. 그래서 sum이 누적합으로 나오지만 정렬 값이 같은 행들은 같은 프레임을 보게 되어 같은 누적값이 찍힙니다. ORDER BY가 없으면 기본 프레임이 파티션 전체라서 모든 행에 같은 합계가 나옵니다. 동점이어도 한 행씩 누적하려면 정렬 키에 id 같은 고유 컬럼을 더하거나 ROWS 프레임을 명시합니다. PostgreSQL 16 기준이고 MySQL 8.4에서도 같게 나왔습니다.

```sql
SELECT sal, sum(sal) OVER (ORDER BY sal) FROM emp;  -- 동점(5200, 5200)은 둘 다 24400
SELECT sal, sum(sal) OVER (ORDER BY sal ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) FROM emp; -- 19200, 24400
```

(공식 문서) PostgreSQL 16 tutorial-window 페이지는 ORDER BY가 있으면 기본 프레임이 파티션 시작부터 현재 행과 정렬상 같은 후속 행까지이고, ORDER BY가 없으면 파티션 전체라고 설명한다. 같은 페이지의 `sum(salary) OVER (ORDER BY salary)` 예시에서 중복 급여가 같은 누적값을 받는다. sql-expressions 페이지는 기본 프레임이 `RANGE UNBOUNDED PRECEDING`이며 ORDER BY가 있으면 현재 행의 마지막 정렬 동순위 행까지이고, ROWS 모드에서는 CURRENT ROW가 현재 행 자체라고 설명한다.
(실험 확인) 급여 4200, 4800, 5000, 5200, 5200인 5행에서 `sum(sal) OVER (ORDER BY sal)`은 4200, 9000, 14000, 24400, 24400이었고 `OVER ()`는 모든 행에 24400이었다. `ORDER BY sal, id`나 `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`로 바꾸면 마지막 두 행이 19200, 24400이 되었고 `RANGE BETWEEN ...`을 명시하면 기본값과 같았다. PostgreSQL 16.15와 MySQL 8.4.11이 같았다.
