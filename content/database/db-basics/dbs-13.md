---
slug: "dbs-13"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "윈도 함수는 GROUP BY 집계와 무엇이 다르고, RANK, DENSE_RANK, ROW_NUMBER는 어떻게 다른가요?"
keywords: ["행이 줄지 않음", "OVER와 PARTITION BY", "RANK는 동순위 후 번호 건너뜀", "DENSE_RANK는 건너뛰지 않음", "ROW_NUMBER는 고유 번호"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/tutorial-window.html", "https://www.postgresql.org/docs/16/functions-window.html"]
---
**모범 답변 (30~60초)**
GROUP BY 집계는 그룹당 한 행으로 줄이지만, 윈도 함수는 OVER 절로 범위를 정해 계산하면서도 각 행을 그대로 남깁니다. PARTITION BY로 그룹을 나누고 윈도 안의 ORDER BY로 순서를 정합니다. 순위 함수는 동점 처리가 다릅니다. RANK는 동점에 같은 순위를 주고 다음 순위를 건너뛰어 1, 1, 3이 되고, DENSE_RANK는 건너뛰지 않아 1, 1, 2가 되며, ROW_NUMBER는 동점이어도 1, 2, 3으로 다른 번호를 줍니다. 윈도 함수는 WHERE에 못 쓰므로 부서별 1등만 뽑으려면 서브쿼리로 감싸 바깥에서 거릅니다. PostgreSQL 16 기준이며 MySQL 8.4에서도 같게 나왔습니다.

```sql
SELECT id, dept, sal,
       rank()       OVER (PARTITION BY dept ORDER BY sal DESC)      AS rk,
       dense_rank() OVER (PARTITION BY dept ORDER BY sal DESC)      AS drk,
       row_number() OVER (PARTITION BY dept ORDER BY sal DESC, id)  AS rn
FROM emp WHERE dept IS NOT NULL;
```

(공식 문서) PostgreSQL 16 tutorial-window 페이지는 윈도 함수가 행을 묶지 않고 각 행을 유지한 채 관련 행 집합에 대해 계산하며, OVER, PARTITION BY, 윈도 ORDER BY를 설명한다. rank 예시에서 동점 두 행이 같은 순위를 받고 다음이 건너뛴다. 윈도 함수는 WHERE 등에서 금지되며 거르려면 서브셀렉트를 쓰라는 예시도 있다. functions-window 페이지는 `row_number`, `rank`(동순위 뒤에 순위 공백이 생김), `dense_rank`(공백 없음)를 정의한다.
(실험 확인) dev 부서 급여 5200, 5200, 4200에서 `rank` 1, 1, 3, `dense_rank` 1, 1, 2, `row_number`(동점 순서를 `id`로 정함) 1, 2, 3이었다. `row_number() ... WHERE rn = 1` 서브쿼리로 부서별 1등 한 행씩을 얻었다. PostgreSQL 16.15와 MySQL 8.4.11이 같았다.
