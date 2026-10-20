---
slug: "dbs-17"
topic: "db-basics"
tier: TRICKY
difficulty: 3
title: "`NOT IN` 서브쿼리 결과에 NULL이 하나라도 있으면 왜 한 행도 안 나오나요?"
keywords: ["NOT IN은 모든 값과 다름", "NULL과 비교하면 unknown", "결과가 true가 아님", "NOT EXISTS로 대체", "IS NOT NULL로 걸러냄"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/functions-subquery.html", "https://www.postgresql.org/docs/16/functions-comparison.html"]
concepts: [null-handling, join-query]
importance: 2
links: [{to: "dbs-04", kind: PREREQ}, {to: "dbs-12", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`x NOT IN (목록)`은 x가 목록의 모든 값과 다르다는 뜻이라, 목록에 NULL이 있으면 `x <> NULL`이 unknown이 됩니다. 일치하는 값이 없고 NULL이 하나라도 있으면 NOT IN의 결과는 false가 아니라 NULL이고, WHERE는 true인 행만 통과시키므로 한 행도 나오지 않습니다. 해결은 서브쿼리에 `IS NOT NULL` 조건을 넣거나 NOT EXISTS로 바꾸는 것입니다. NOT EXISTS는 값 비교가 아니라 행이 존재하는지만 보므로 NULL의 영향을 받지 않습니다. PostgreSQL 16 기준이고 MySQL 8.4(InnoDB)에서도 같게 나왔습니다.

```sql
SELECT name FROM cust WHERE id NOT IN (SELECT cust_id FROM ord);                -- 0행 (cust_id에 NULL)
SELECT name FROM cust WHERE id NOT IN (SELECT cust_id FROM ord WHERE cust_id IS NOT NULL); -- park
SELECT name FROM cust c WHERE NOT EXISTS (SELECT 1 FROM ord o WHERE o.cust_id = c.id);     -- park
```

(공식 문서) PostgreSQL 16 functions-subquery 페이지는 오른쪽에 일치하는 값이 없고 NULL을 낸 행이 하나라도 있으면 NOT IN의 결과는 true가 아니라 NULL이라고 설명하며, 이것이 SQL의 일반 NULL 논리에 따른 것이라고 한다. functions-comparison 페이지는 NULL과의 일반 비교가 NULL을 낸다고 한다.
(실험 확인) `ord.cust_id`가 (1, 1, 2, NULL)일 때 위 세 쿼리는 각각 0행, park, park이었다. 리터럴 목록에서도 `3 NOT IN (1,2,NULL)`은 NULL, `1 IN (1,NULL)`은 true, `3 IN (1,NULL)`은 NULL이었다. PostgreSQL 16.15와 MySQL 8.4.11 모두 같았다.
