---
slug: "dbs-12"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "서브쿼리(IN, EXISTS)와 JOIN은 어떻게 다르고 어떻게 골라야 하나요?"
keywords: ["JOIN은 일대다에서 행이 늘어남", "IN과 EXISTS는 존재 여부만", "DISTINCT로 중복 제거", "자식 컬럼이 필요하면 JOIN", "성능은 실행 계획으로 확인"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/functions-subquery.html", "https://www.postgresql.org/docs/16/queries-table-expressions.html"]
concepts: [join-query]
importance: 2
links: [{to: "dbs-17", kind: FOLLOWUP}, {to: "dbp-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
JOIN은 두 테이블의 행을 결합해 양쪽 컬럼을 모두 가져올 수 있지만, 일대다 관계에서는 부모 행이 자식 수만큼 늘어납니다. IN이나 EXISTS 서브쿼리는 상대 테이블에 대응하는 행이 있는지만 확인하므로 부모 행이 한 번씩만 나옵니다. 그래서 자식 컬럼이 필요 없고 존재 여부만 볼 때는 EXISTS나 IN이 의도에 맞고, JOIN에 DISTINCT를 붙여 중복을 지우는 방식과 결과가 같을 수 있습니다. 자식 컬럼도 함께 필요하면 JOIN을 씁니다. 어느 쪽이 빠른지는 데이터와 버전에 따라 달라 단정할 수 없고 실행 계획으로 확인해야 하며, 이 답은 PostgreSQL 16 기준입니다.

```sql
SELECT c.name FROM cust c JOIN ord o ON o.cust_id = c.id;              -- kim이 두 번
SELECT name FROM cust c WHERE EXISTS (SELECT 1 FROM ord o WHERE o.cust_id = c.id);  -- kim은 한 번
```

(공식 문서) PostgreSQL 16 functions-subquery 페이지는 EXISTS가 서브쿼리가 한 행이라도 반환하는지만으로 결과를 정하고 행의 내용은 중요하지 않다고 설명하며, IN과 NOT IN의 NULL 처리 규칙도 설명한다. queries-table-expressions 페이지는 WHERE 안의 `IN (SELECT ...)`와 `EXISTS (SELECT ...)` 예시를 보여 준다.
(실험 확인) `cust`(kim, lee, park)와 `ord`(kim 주문 2건, lee 1건, 고객 없는 주문 1건)에서 JOIN은 kim, kim, lee 세 행, `IN`, `EXISTS`, `JOIN` + `DISTINCT`는 kim, lee 두 행이었다. PostgreSQL 16.15와 MySQL 8.4.11이 같았다. 실행 계획과 속도는 비교하지 않았다.
(보충) 존재 여부만 볼 때 EXISTS나 IN이 의도에 맞고 자식 컬럼이 필요하면 JOIN을 쓰라는 선택 기준은 일반적인 실무 설명이며 공식 문서가 순위를 정한 것은 아니다.
