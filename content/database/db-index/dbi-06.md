---
slug: "dbi-06"
topic: "db-index"
tier: BASIC
difficulty: 1
title: "기본 키나 UNIQUE 제약을 만들면 인덱스가 자동으로 생기나요? 외래 키는 어떤가요?"
keywords: ["유니크 제약용 자동 인덱스", "중복 인덱스 불필요", "NULL 중복 허용", "외래 키 컬럼은 자동 인덱스 없음", "NULLS NOT DISTINCT"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-unique.html", "https://www.postgresql.org/docs/16/ddl-constraints.html", "https://www.postgresql.org/docs/16/indexes-partial.html", "https://dev.mysql.com/doc/refman/8.4/en/create-index.html"]
concepts: [index-structure, schema-design]
importance: 2
links: [{to: "dbs-01", kind: RELATED}, {to: "dbs-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서는 기본 키나 UNIQUE 제약을 정의하면 해당 컬럼, 복합이면 여러 컬럼에 대한 유니크 B-tree 인덱스가 자동으로 생기고, 그 인덱스가 제약을 강제하는 수단입니다. 그래서 같은 컬럼에 인덱스를 직접 또 만들면 중복입니다. UNIQUE에서 NULL은 기본적으로 서로 같지 않다고 보아 여러 개 들어갈 수 있고, NULLS NOT DISTINCT 옵션을 주면 NULL도 중복으로 취급합니다. 반면 외래 키를 선언해도 참조하는 쪽 컬럼에는 인덱스가 자동으로 생기지 않으니, 부모 행 삭제나 수정 때 자식 테이블 검색이 필요하면 직접 만들어야 합니다.

(공식 문서) Unique Indexes 절(11.6)은 현재 B-tree만 유니크로 선언할 수 있고, 기본값으로 NULL은 서로 같지 않아 여러 개를 허용하며 `NULLS NOT DISTINCT`가 이를 바꾼다고 한다. 유니크 제약이나 기본 키를 정의하면 PostgreSQL이 유니크 인덱스를 자동으로 만들고 이것이 제약을 강제하는 메커니즘이므로 직접 만들면 중복이 된다고 한다. 제약 문서는 외래 키 선언이 참조하는 쪽 컬럼에 인덱스를 자동 생성하지 않고, 참조되는 쪽의 DELETE·UPDATE가 참조 테이블 스캔을 요구하므로 참조 컬럼에도 인덱스를 두는 것이 대개 좋다고 한다. 11.8은 `WHERE success` 같은 부분 유니크 인덱스로 일부 행에 대해서만 유일성을 강제하는 예를 보인다. MySQL 8.4 CREATE INDEX 문서는 UNIQUE 인덱스가 NULL을 가질 수 있는 컬럼에서 여러 NULL을 허용한다고 한다.
(실험 확인) PostgreSQL 16.15에서 `a int UNIQUE` 컬럼에 NULL 두 개와 1을 넣고 1을 다시 넣으면 중복 오류가 났다(NULL 두 건은 들어감). `UNIQUE NULLS NOT DISTINCT`에서는 두 번째 NULL이 `Key (a)=(null) already exists`로 거부됐다. 기본 키와 외래 키를 가진 부모·자식 테이블의 `pg_index`에는 두 기본 키 인덱스만 있고 자식의 외래 키 컬럼 인덱스는 없었다. `UNIQUE (subject, target) WHERE success` 부분 유니크 인덱스는 성공 행 두 번째 삽입을 거부했고 실패 행은 여러 개 들어갔다. MySQL 8.4.11(InnoDB)에서도 UNIQUE 컬럼에 NULL을 두 번 넣을 수 있었고 같은 값 1의 두 번째 삽입은 `Duplicate entry '1'` 오류였다.
