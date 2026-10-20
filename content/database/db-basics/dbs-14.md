---
slug: "dbs-14"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "CHECK, NOT NULL, DEFAULT 제약은 각각 무엇을 하고, CHECK에서 주의할 점은 무엇인가요?"
keywords: ["NOT NULL은 NULL 금지", "DEFAULT는 생략 시 채움", "CHECK는 true 또는 NULL이면 통과", "다른 행·테이블 참조 불가", "명시한 NULL에는 DEFAULT 미적용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-constraints.html", "https://www.postgresql.org/docs/16/ddl-default.html", "https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html"]
concepts: [schema-design, null-handling]
importance: 2
links: [{to: "dbs-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
NOT NULL은 컬럼에 NULL이 들어가는 것을 막고, DEFAULT는 INSERT에서 그 컬럼을 생략하거나 DEFAULT 키워드를 썼을 때 채울 값을 정하며, CHECK는 행이 만족해야 하는 조건식입니다. 가장 흔한 함정은 CHECK가 조건이 true일 때뿐 아니라 NULL일 때도 통과한다는 점이라 `CHECK (price > 0)`만으로는 NULL이 막히지 않고 NOT NULL을 따로 줘야 합니다. DEFAULT는 값을 생략했을 때만 쓰이고 NULL을 직접 넣으면 그대로 NULL이 들어가 NOT NULL에 걸립니다. PostgreSQL 16 기준으로 CHECK는 새로 쓰는 그 행의 값만 볼 수 있어 다른 행이나 테이블을 조회하는 조건은 쓸 수 없습니다. MySQL 8.4(InnoDB)에서도 CHECK가 강제됩니다.

```sql
CREATE TABLE prod(
  id int PRIMARY KEY,
  price numeric CHECK (price > 0),             -- NULL은 통과
  qty int NOT NULL DEFAULT 1,
  status text DEFAULT 'NEW' CHECK (status IN ('NEW','PAID'))
);
```

(공식 문서) PostgreSQL 16 ddl-constraints 페이지는 CHECK가 식이 true 또는 NULL이면 만족한다고 설명하고, NULL을 막으려면 NOT NULL을 쓰라고 한다. 같은 행의 값만 참조해야 하며 다른 행의 데이터를 참조하는 CHECK는 지원하지 않고, 필요하면 트리거를 쓸 수 있다고 한다. ddl-default 페이지는 명시하지 않으면 기본값이 NULL이고, 컬럼 값을 생략하거나 DEFAULT 요청 시 기본값이 채워진다고 한다. MySQL 8.4 create-table-check-constraints 페이지는 ENFORCED가 기본이라 제약이 강제되고, 서브쿼리는 허용되지 않는다고 하고, 식이 TRUE 또는 NULL(UNKNOWN)이면 통과하고 FALSE일 때 위반이라고 한다.
(실험 확인) 위 구조(+ `disc` 컬럼과 `CHECK (price > disc)`)에서 `price` NULL 삽입은 성공했고, 음수 가격, 허용 외 `status`, `disc` 초과는 CHECK 위반, `qty`에 NULL을 직접 넣으면 NOT NULL 위반, `qty` 생략이나 `DEFAULT`는 1이 채워졌다. CHECK 안 서브쿼리는 PostgreSQL 16.15에서 `cannot use subquery in check constraint`, MySQL 8.4.11에서 오류 3815였다.
