---
slug: "dbs-05"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "WHERE와 HAVING은 어떻게 다른가요?"
keywords: ["WHERE는 그룹 전 행 필터", "HAVING은 그룹 후 필터", "집계 함수는 WHERE 불가", "GROUP BY 없이도 HAVING 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-table-expressions.html"]
---
**모범 답변 (30~60초)**
WHERE는 GROUP BY로 묶기 전에 개별 행을 거르고, HAVING은 묶은 뒤 그룹 단위로 거릅니다. 그래서 `sum()`이나 `count()` 같은 집계 결과로 조건을 걸려면 HAVING을 써야 하고, 집계 함수를 WHERE에 쓰면 오류가 납니다. 행 단위 조건은 WHERE에, 그룹 집계 조건은 HAVING에 나누어 쓰는 것이 문서 예시이기도 합니다. 집계 함수만 있고 GROUP BY가 없어도 전체가 한 그룹이 되므로 HAVING을 쓸 수 있습니다. PostgreSQL 16 기준이며 MySQL 8.4에서도 같게 동작했습니다.

```sql
SELECT dept, sum(sal) FROM emp
WHERE sal > 3000          -- 행 단위 필터
GROUP BY dept
HAVING sum(sal) > 5000;   -- 그룹 단위 필터
```

(공식 문서) PostgreSQL 16 queries-table-expressions 페이지는 WHERE를 통과한 행에 GROUP BY를 적용하고 HAVING으로 그룹을 제거한다고 설명하며, 집계 함수가 있으면 GROUP BY가 없어도 결과가 하나의 그룹 행이 되고, HAVING만 있어도 마찬가지라고 한다. 같은 페이지의 판매 예시는 행 조건(최근 판매)을 WHERE에, 그룹 합계 조건을 HAVING에 둔다.
(실험 확인) 위 쿼리는 dev 14600, sales 9800 두 행을 반환했다(NULL 부서는 합 3500이라 제외). 집계 함수를 WHERE에 쓰면 PostgreSQL 16.15는 `aggregate functions are not allowed in WHERE`, MySQL 8.4.11은 `Invalid use of group function`(1111) 오류였다. `SELECT count(*) FROM emp HAVING count(*) > 100`은 두 DB 모두 0행이었다.
