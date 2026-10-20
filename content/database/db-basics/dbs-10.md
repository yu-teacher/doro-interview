---
slug: "dbs-10"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "LEFT JOIN에서 조건을 ON에 쓰는 것과 WHERE에 쓰는 것은 왜 결과가 다른가요?"
keywords: ["ON은 조인 단계 조건", "WHERE는 조인 후 필터", "NULL 행 제거로 INNER처럼 동작", "안티 조인 IS NULL"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-table-expressions.html"]
---
**모범 답변 (30~60초)**
LEFT JOIN에서 ON 조건은 어떤 행끼리 짝이 맞는지를 정하는 조건이고, 짝이 없으면 왼쪽 행은 오른쪽 컬럼이 NULL인 채로 남습니다. 반면 WHERE는 조인이 끝난 결과에서 행을 거르는데, 오른쪽 컬럼에 건 조건은 NULL로 채워진 행을 거짓으로 만들어 지워 버려서 결과가 사실상 INNER JOIN이 됩니다. 그래서 오른쪽 테이블만 필터링하면서 왼쪽 행을 모두 유지하려면 조건을 ON에 둡니다. 반대로 짝이 없는 행만 찾는 안티 조인은 LEFT JOIN 뒤에 오른쪽 키 IS NULL을 WHERE에 씁니다. PostgreSQL 16 기준이고 MySQL 8.4에서도 같게 나왔습니다.

```sql
SELECT * FROM t1 LEFT JOIN t2 ON t1.num = t2.num AND t2.value = 'xxx';  -- 3행
SELECT * FROM t1 LEFT JOIN t2 ON t1.num = t2.num WHERE t2.value = 'xxx'; -- 1행
```

(공식 문서) PostgreSQL 16 queries-table-expressions 페이지는 같은 쿼리를 ON 절과 WHERE 절로 바꿨을 때 결과가 다른 예를 보여 주고, ON 절의 제한은 조인 전에, WHERE 절의 제한은 조인 후에 처리되어 외부 조인에서는 차이가 크다고 설명한다. 외부 조인의 ON/USING은 행을 더하기도 하고 제거하기도 하므로 WHERE와 같지 않다는 설명도 있다.
(실험 확인) t1 = (1, 2, 3), t2 = (1, 3, 5)에서 첫 쿼리는 3행(2와 3은 오른쪽이 NULL), 둘째 쿼리는 1행이었다. `LEFT JOIN ... WHERE t2.num IS NULL`은 짝 없는 2 한 행이었다. PostgreSQL 16.15와 MySQL 8.4.11 모두 같았다.
