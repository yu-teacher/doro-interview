---
slug: "dbs-18"
topic: "db-basics"
tier: TRICKY
difficulty: 3
title: "UNIQUE 컬럼에는 NULL을 여러 개 넣을 수 있나요? DB마다 다른가요?"
keywords: ["NULL끼리 같지 않게 취급", "NULLS NOT DISTINCT", "SQL 표준은 구현 정의", "MySQL도 NULL 여러 개", "부분 유니크 인덱스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-constraints.html", "https://www.postgresql.org/docs/16/indexes-unique.html", "https://dev.mysql.com/doc/refman/8.4/en/create-index.html"]
concepts: [null-handling, schema-design]
importance: 1
links: [{to: "dbs-01", kind: PREREQ}, {to: "dbs-04", kind: PREREQ}, {to: "dbi-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 기본은 가능합니다. 유니크 제약은 NULL끼리를 서로 같다고 보지 않아서 NULL이 들어 있는 행은 몇 개든 중복으로 취급되지 않습니다. 이 동작을 바꾸려면 `UNIQUE NULLS NOT DISTINCT`를 지정하면 NULL도 같은 값으로 보고 하나만 허용합니다. 공식 문서는 유니크 제약의 NULL 처리가 SQL 표준에서 구현 정의라 DB마다 다를 수 있으니 이식성에 주의하라고 합니다. MySQL 8.4 매뉴얼도 UNIQUE 인덱스가 NULL 가능 컬럼에 여러 NULL을 허용한다고 하고, 실험(InnoDB)에서도 그랬습니다. 일부 행에만 유일성을 걸고 싶으면 PostgreSQL의 부분 유니크 인덱스를 씁니다.

```sql
CREATE TABLE users(id int PRIMARY KEY, email text UNIQUE, nick text UNIQUE NULLS NOT DISTINCT);
```

(공식 문서) PostgreSQL 16 ddl-constraints 페이지는 유니크 제약에서 두 NULL은 기본적으로 같다고 보지 않아 NULL이 든 중복 행을 저장할 수 있고, `NULLS NOT DISTINCT`로 이를 바꿀 수 있으며, SQL 표준에서 NULL 처리가 구현 정의라 이식성에 주의하라고 설명한다. 일부 행에만 걸리는 유일성은 유니크 제약으로 쓸 수 없고 부분 유니크 인덱스로 구현한다고 한다. indexes-unique 페이지도 같은 내용과 `NULLS [NOT] DISTINCT` 옵션을 설명한다. MySQL 8.4 create-index 페이지는 UNIQUE 인덱스가 NULL이 될 수 있는 컬럼에 여러 NULL을 허용한다고 적는다.
(실험 확인) PostgreSQL 16.15에서 `email` 컬럼에 NULL인 행 두 개가 들어갔고, `nick` 컬럼(`NULLS NOT DISTINCT`)은 NULL인 행이 이미 있을 때 NULL을 하나 더 넣자 `duplicate key value violates unique constraint "users_nick_key"` 오류였다. MySQL 8.4.11(InnoDB)에서는 `email`, `nick` 모두 `UNIQUE`인 컬럼에 NULL이 든 행이 여러 개 들어갔다. MySQL 8.4.11에서 `UNIQUE NULLS NOT DISTINCT`는 문법 오류(1064)였다. PostgreSQL에서 `WHERE NOT deleted` 부분 유니크 인덱스는 `deleted`가 true인 행끼리는 같은 값을 허용하고 false인 행 두 개는 막았다.
