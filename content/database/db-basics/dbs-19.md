---
slug: "dbs-19"
topic: "db-basics"
tier: TRICKY
difficulty: 3
title: "조건에 맞는 행이 하나도 없을 때 COUNT는 0인데 SUM은 NULL인 이유는 무엇이고, GROUP BY가 있으면 어떻게 되나요?"
keywords: ["GROUP BY 없는 집계는 한 행", "COUNT는 0", "SUM은 NULL", "COALESCE로 0 치환", "GROUP BY는 빈 결과"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/functions-aggregate.html", "https://www.postgresql.org/docs/16/queries-table-expressions.html"]
concepts: [sql-aggregation, null-handling]
importance: 1
links: [{to: "dbs-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
GROUP BY 없이 집계 함수만 쓰면 입력이 0행이어도 전체가 한 그룹이라 결과 행은 항상 하나 나옵니다. 이때 count는 0을 돌려주지만 sum, avg, max 같은 나머지 집계는 NULL을 돌려줍니다. 합계가 0으로 보여야 할 곳에서 NULL이 나오거나 이후 계산이 NULL이 되는 일이 생기므로 `COALESCE(sum(x), 0)`으로 바꿔 줍니다. 반면 GROUP BY가 있으면 그룹이 하나도 없으므로 결과도 0행입니다. PostgreSQL 16 기준이고 MySQL 8.4에서도 같게 동작했습니다.

```sql
SELECT count(*), sum(sal), max(sal) FROM emp WHERE id > 100;   -- 0, NULL, NULL (1행)
SELECT dept, count(*) FROM emp WHERE id > 100 GROUP BY dept;   -- 0행
SELECT COALESCE(sum(sal), 0) FROM emp WHERE id > 100;          -- 0
```

(공식 문서) PostgreSQL 16 functions-aggregate 페이지는 count를 제외한 집계 함수가 선택된 행이 없을 때 NULL을 돌려주며, 특히 행이 없는 sum은 0이 아니라 NULL이므로 필요하면 `COALESCE`를 쓰라고 설명한다. queries-table-expressions 페이지는 집계 함수가 있는데 GROUP BY가 없어도 결과는 단일 그룹 행이 된다고 한다.
(실험 확인) 위 세 쿼리는 주석대로 나왔다(첫 쿼리는 `count(*)` 0, `count(sal)` 0, `sum` NULL, `max` NULL). PostgreSQL 16.15와 MySQL 8.4.11 모두 같았다.
