---
slug: "dbs-03"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL JOIN, CROSS JOIN은 각각 어떻게 다른가요?"
keywords: ["INNER는 매칭 행만", "LEFT는 왼쪽 행 전부 유지", "FULL은 양쪽 유지", "CROSS는 곱집합", "매칭 없으면 NULL"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.postgresql.org/docs/16/queries-table-expressions.html", "https://dev.mysql.com/doc/refman/8.4/en/join.html"]
concepts: [join-query]
importance: 3
links: [{to: "dbs-10", kind: FOLLOWUP}, {to: "dbs-12", kind: FOLLOWUP}, {to: "dbp-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
INNER JOIN은 조건이 참인 행 쌍만 돌려줍니다. LEFT JOIN은 내부 조인을 한 뒤 오른쪽에 짝이 없는 왼쪽 행을 오른쪽 컬럼을 NULL로 채워 추가하므로 왼쪽 행은 하나도 사라지지 않고, RIGHT JOIN은 방향만 반대입니다. FULL JOIN은 양쪽의 짝 없는 행을 모두 유지하고, CROSS JOIN은 조건 없이 N 곱하기 M개의 모든 조합을 만듭니다. PostgreSQL 16 기준으로 다섯 가지가 모두 되지만, MySQL 8.4에서는 FULL OUTER JOIN 문법이 없어서 LEFT JOIN 결과에 오른쪽에만 있는 행을 UNION ALL로 붙여 흉내 냅니다.

| t1 = (1,2,3), t2 = (1,3,5) | 결과 행 수 | 특징 |
|---|---|---|
| INNER | 2 | 1, 3 |
| LEFT | 3 | 2는 오른쪽이 NULL |
| RIGHT | 3 | 5는 왼쪽이 NULL |
| CROSS | 9 | 3 x 3 |

(공식 문서) PostgreSQL 16 queries-table-expressions 페이지가 CROSS, INNER, LEFT/RIGHT/FULL OUTER 조인의 정의를 단계별로 설명한다. 특히 외부 조인은 먼저 내부 조인을 하고 짝 없는 행을 NULL로 채워 더한다고 서술한다. MySQL 8.4 매뉴얼 JOIN 페이지의 문법 절에는 INNER|CROSS JOIN, STRAIGHT_JOIN, LEFT|RIGHT [OUTER] JOIN, NATURAL JOIN이 나오고 FULL은 없다.
(실험 확인) 위 표의 행 수는 두 DB에서 모두 그대로 나왔다. PostgreSQL 16.15는 `FULL OUTER JOIN`이 되지만 MySQL 8.4.11은 같은 문장이 문법 오류(1064)였고, `LEFT JOIN ... UNION ... RIGHT JOIN`으로는 4행(1, 2, 3, 5 기준)이 나왔다. 다만 t1 = (10, 20, 30, 30), t2 = (10, 30, 50)처럼 중복 값이 있는 데이터에서는 PostgreSQL의 `FULL JOIN`이 5행인데 단순 UNION 방식은 중복 행이 합쳐져 4행이었고, `LEFT JOIN ... UNION ALL (RIGHT JOIN ... WHERE 왼쪽 키 IS NULL)`은 5행으로 일치했다. MySQL 8.4.11에서 `OUTER`를 빼고 `FULL JOIN`이라고만 쓰면 문법 오류 없이 FULL이 테이블 별칭처럼 처리되어 `ON t1.num = t2.num`이 "Unknown column" 오류가 났고, `USING (num)`으로 쓰면 내부 조인 결과(3행)가 나왔다. `FROM t1, t2`는 `CROSS JOIN`과 같은 9행이었다.
(보충) MySQL에서 FULL JOIN을 LEFT JOIN과 UNION ALL로 흉내 내는 방법은 참고한 매뉴얼 JOIN 페이지에 나오지 않는 일반적인 우회 방법이고, 위 실험으로만 확인했다.
