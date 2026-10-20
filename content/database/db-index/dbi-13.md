---
slug: "dbi-13"
topic: "db-index"
tier: DEEP
difficulty: 2
title: "LIKE 'abc%'는 인덱스를 타는데 LIKE '%abc'는 왜 못 타고, PostgreSQL에서는 어떻게 해결하나요?"
keywords: ["앞부분 고정 상수 패턴", "범위 조건으로 변환", "로케일과 text_pattern_ops", "pg_trgm GIN", "MySQL 접두 매칭"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-types.html", "https://www.postgresql.org/docs/16/indexes-opclass.html", "https://www.postgresql.org/docs/16/pgtrgm.html", "https://dev.mysql.com/doc/refman/8.4/en/index-btree-hash.html"]
---
**모범 답변 (30~60초)**
B-tree는 값이 정렬되어 있어서, 패턴이 상수이고 앞부분이 고정된 LIKE 'foo%'는 foo로 시작하는 구간이라는 범위 조건으로 바꿔 찾을 수 있지만, 앞에 와일드카드가 오면 정렬 순서로 구간을 좁힐 수 없습니다. 주의할 점은 PostgreSQL 16에서 데이터베이스가 C 로케일이 아니면 기본 연산자 클래스의 B-tree는 LIKE에 쓸 수 없어서, text_pattern_ops 같은 연산자 클래스로 인덱스를 따로 만들어야 한다는 것입니다. '%abc%'처럼 양쪽에 와일드카드가 있는 검색은 pg_trgm 확장의 GIN 또는 GiST 트라이그램 인덱스가 처리합니다. MySQL 8.4(InnoDB)에서는 패턴이 상수이고 와일드카드로 시작하지 않으면 B-tree를 쓰는 점이 같습니다.

```sql
CREATE INDEX o_email_pat  ON orders (email text_pattern_ops);
CREATE INDEX o_email_trgm ON orders USING gin (email gin_trgm_ops);  -- pg_trgm 확장 필요
```

(공식 문서) PostgreSQL 11.2.1은 LIKE와 `~`가 패턴이 상수이고 문자열 앞에 고정될 때 B-tree를 쓸 수 있고 `LIKE '%bar'`는 안 된다고 하며, C 로케일이 아니면 특별한 연산자 클래스가 필요하다고 한다. 11.10은 `text_pattern_ops`가 로케일 정렬 규칙 대신 문자 단위로 비교해 C가 아닌 로케일에서 패턴 검색을 가능하게 하고, 이 클래스 인덱스는 `<`, `>` 같은 일반 비교에는 쓸 수 없으니 필요하면 기본 클래스 인덱스를 따로 만들라고 한다. pg_trgm 문서는 GiST·GIN 트라이그램 인덱스가 LIKE, ILIKE, `~`, `~*` 검색을 지원하고 B-tree와 달리 왼쪽 고정이 필요 없으며, 추출할 트라이그램이 없는 패턴은 인덱스 전체 스캔이 된다고 한다. MySQL 8.4 B-tree 문서는 `LIKE`의 인자가 와일드카드로 시작하지 않는 상수 문자열이면 인덱스를 쓰고 `'%Patrick%'`는 안 쓴다고 한다. 같은 문서는 `'Patrick%'`가 'Patrick' <= key_col < 'Patricl' 범위의 행만 보는 것으로 처리된다고 예시한다.
(실험 확인) PostgreSQL 16.15(`en_US.utf8`), 행 20만 개 `orders`에서 기본 B-tree 인덱스가 있어도 `email LIKE 'User777%'`는 Seq Scan이었다. `text_pattern_ops` 인덱스를 만들자 `Index Cond: ((email ~>=~ 'User777') AND (email ~<~ 'User778'))`인 Index Scan이 되었고(`'User7777%'`는 11행, 0.045 ms), `LIKE '%777@Example.com'`은 여전히 Seq Scan이었다. `pg_trgm` GIN 인덱스를 만들면 후자도 Bitmap Index Scan으로 200행을 찾았다(6.956 ms). 인덱스 크기는 trgm 7,000 kB, pattern_ops 7,960 kB였다. MySQL 8.4.11에서는 `LIKE 'User777%'`가 `range`로 `idx_email`을 썼고 `LIKE '%777@Example.com'`은 `type: ALL`이었다.
