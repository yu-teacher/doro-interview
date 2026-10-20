---
slug: "dbs-01"
topic: "db-basics"
tier: BASIC
difficulty: 1
title: "기본키(PRIMARY KEY)와 유니크 제약(UNIQUE)은 어떻게 다른가요?"
keywords: ["기본키는 유일하고 NOT NULL", "테이블당 하나", "유니크 인덱스 자동 생성", "UNIQUE는 여러 개 가능", "외래키 기본 참조 대상"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-constraints.html", "https://www.postgresql.org/docs/16/indexes-unique.html"]
concepts: [schema-design]
importance: 3
links: [{to: "dbs-02", kind: FOLLOWUP}, {to: "dbs-18", kind: FOLLOWUP}, {to: "dbi-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
기본키는 행을 식별하는 값으로, 유일해야 하고 NULL이 될 수 없으며 테이블당 하나만 둘 수 있습니다. 유니크 제약은 값이 중복되지 않게만 막고, 한 테이블에 여러 개 둘 수 있습니다. PostgreSQL 16 기준으로 둘 다 만들면 유니크 B-tree 인덱스가 자동으로 생기고 그 인덱스가 중복을 검사합니다. 외래키는 참조 대상 컬럼을 생략하면 상대 테이블의 기본키를 가리킵니다. 유니크 컬럼은 NULL을 허용하는 것이 기본이라, 기본키와 달리 NULL이 들어갈 수 있다는 점이 가장 큰 차이입니다.

```sql
CREATE TABLE users(
  id    int  PRIMARY KEY,   -- UNIQUE + NOT NULL, 테이블당 하나
  email text UNIQUE         -- 여러 개 둘 수 있고 NULL 허용
);
```

(공식 문서) PostgreSQL 16 ddl-constraints 페이지는 기본키가 유일성과 NOT NULL을 함께 요구하고, 테이블에 최대 하나이며, 만들면 유니크 B-tree 인덱스가 자동 생성되고 외래키의 기본 참조 대상이 된다고 설명한다. 이론상 모든 테이블이 기본키를 가져야 하지만 PostgreSQL이 강제하지는 않는다고도 한다. 유니크 제약은 기본적으로 NULL끼리 같다고 보지 않는다고 적혀 있고, 인덱스는 indexes-unique 페이지에도 설명된다(NULL 처리 자세한 내용은 dbs-18).
(실험 확인) PostgreSQL 16.15에서 기본키 컬럼에 NULL을 넣으면 not-null 위반 오류, 같은 값을 다시 넣으면 `users_pkey` 중복 오류, 두 번째 기본키를 추가하면 `multiple primary keys for table "users" are not allowed` 오류가 났다. 제약 3개를 만들었더니 `users_pkey`, `users_email_key` 등 인덱스 3개가 자동으로 생겼다. MySQL 8.4.11(InnoDB)에서도 기본키 컬럼에 NULL은 `Column 'id' cannot be null`, 중복 값은 `Duplicate entry` 오류였다.
