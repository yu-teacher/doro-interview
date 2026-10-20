---
slug: "dbs-11"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "GROUP BY에 없는 컬럼을 SELECT에 쓰면 어떻게 되나요? PostgreSQL과 MySQL은 어떻게 다른가요?"
keywords: ["집계 안에서만 허용", "기본키 기능적 종속", "ONLY_FULL_GROUP_BY", "끄면 비결정적 값"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-table-expressions.html", "https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html"]
concepts: [sql-aggregation]
importance: 2
links: [{to: "dbs-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
그룹마다 한 행만 나오므로 GROUP BY에 없는 컬럼은 집계 함수 안에서만 쓸 수 있고, 그렇지 않으면 PostgreSQL 16은 오류를 냅니다. 예외는 GROUP BY 컬럼이 기본키처럼 다른 컬럼 값을 하나로 정해 주는 기능적 종속 관계일 때로, 기본키로 묶으면 그 테이블의 다른 컬럼을 그대로 SELECT에 쓸 수 있습니다. MySQL 8.4도 기능적 종속을 감지하고 ONLY_FULL_GROUP_BY 모드가 기본으로 켜져 있어 같은 쿼리를 거부합니다. 이 모드를 끄면 그룹 안의 어느 행 값이 나올지 정해지지 않아 결과가 비결정적이므로 끄는 것은 권하지 않습니다.

```sql
SELECT dept, id FROM emp GROUP BY dept;                        -- 오류
SELECT c.id, c.name, sum(o.amt) FROM cust c JOIN ord o ON o.cust_id = c.id
GROUP BY c.id;                                                  -- c.id가 기본키라 허용
```

(공식 문서) PostgreSQL 16 queries-table-expressions 페이지는 그룹화된 테이블에서 GROUP BY에 없는 컬럼은 집계 식 밖에서 참조할 수 없고, 기본키로 묶으면 다른 컬럼이 함수적으로 종속되어 모호하지 않으므로 기본키만 묶어도 충분하다고 설명한다. MySQL 8.4 group-by-handling 페이지는 MySQL이 기능적 종속을 감지하며 ONLY_FULL_GROUP_BY가 기본으로 켜져 있어 종속되지 않은 비집계 컬럼 쿼리를 거부하고, 끄면 값이 비결정적이라고 설명한다.
(실험 확인) PostgreSQL 16.15는 첫 쿼리에 `column "emp.id" must appear in the GROUP BY clause or be used in an aggregate function`, MySQL 8.4.11은 오류 1055를 냈다. `GROUP BY e.id`로 `e.dept`를 SELECT하는 쿼리와 위 조인 쿼리는 두 DB 모두 성공했다. MySQL 8.4.11 기본 `sql_mode`에 `ONLY_FULL_GROUP_BY`가 들어 있었고, 세션에서 이를 뺀 뒤에는 같은 쿼리가 오류 없이 그룹마다 임의의 `id`를 돌려주었다. `UNIQUE NOT NULL` 컬럼만으로 묶은 경우에는 PostgreSQL 16.15가 다른 컬럼 SELECT를 거부했고 MySQL 8.4.11은 허용했는데, MySQL 매뉴얼은 기본키 또는 유니크 NOT NULL 컬럼이면 기능적 종속으로 본다고 설명한다.
