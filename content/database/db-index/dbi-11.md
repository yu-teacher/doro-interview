---
slug: "dbi-11"
topic: "db-index"
tier: DEEP
difficulty: 2
title: "WHERE lower(email) = ... 같은 조건에 인덱스를 쓰려면 어떻게 하나요(표현식 인덱스)?"
keywords: ["표현식 인덱스", "쿼리 식과 같은 형태", "저장된 값을 비교", "쓰기 시 계산 비용", "MySQL 함수 키 파트"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-expressional.html", "https://dev.mysql.com/doc/refman/8.4/en/create-index.html"]
concepts: [index-design]
importance: 2
links: [{to: "dbi-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
인덱스 컬럼에는 컬럼 대신 함수나 스칼라 식의 결과를 둘 수 있습니다. CREATE INDEX ON t (lower(col))를 만들면 WHERE lower(col) = '값' 조건에 인덱스를 쓸 수 있고, 검색할 때는 식을 다시 계산하지 않고 인덱스에 저장된 값을 비교합니다. 대신 행을 삽입하거나 HOT이 아닌 업데이트를 할 때마다 식을 계산해야 해서 쓰기 비용이 크므로, 조회 속도가 더 중요할 때 씁니다. 쿼리 쪽 식이 인덱스 식과 같은 형태여야 쓰이고, UNIQUE를 붙이면 대소문자만 다른 값을 막는 제약도 만들 수 있습니다. MySQL 8.4(InnoDB)에서는 함수 키 파트라고 부르며 식을 괄호로 감싸 만듭니다.

```sql
CREATE INDEX orders_lower_email ON orders (lower(email));   -- PostgreSQL 16
CREATE INDEX idx_lower_email ON orders ((LOWER(email)));    -- MySQL 8.4
```

(공식 문서) PostgreSQL 11.7은 인덱스 컬럼이 테이블 컬럼이 아닌 함수나 스칼라 식일 수 있고, `lower(col1)` 인덱스로 대소문자 무시 비교를 빠르게 할 수 있다고 한다. UNIQUE로 만들면 대소문자만 다른 값을 막는 단순 유니크 제약으로 못 하는 제약도 구현된다고 한다. 식 인덱스는 삽입과 non-HOT 업데이트마다 식을 계산해야 해서 유지 비용이 비싸지만 검색 때는 재계산하지 않으므로 검색 속도가 삽입·갱신 속도보다 중요할 때 유용하다고 한다. 식은 괄호로 감싸야 하지만 함수 호출 하나면 생략할 수 있다고 한다. MySQL 8.4 CREATE INDEX 문서는 함수 키 파트의 식을 괄호로 감싸야 하고 ASC·DESC를 쓸 수 있다고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `lower(email) = 'user777@example.com'`은 인덱스 없이 Seq Scan(26.935 ms, 버퍼 2,439개), 표현식 인덱스를 만들고 나서는 Index Scan(0.028 ms)이었다. 같은 인덱스로 `upper(email) = ...`나 `email ILIKE ...`는 Seq Scan이어서 식이 같아야 쓰인다는 것을 확인했다. 표현식 인덱스 컬럼의 통계는 `pg_stats`에 `lower`라는 이름으로 따로 생겼다. MySQL 8.4.11에서는 `LOWER(email) = ...`이 `type: ALL`이었다가 함수 인덱스를 만든 뒤 `ref`로 `idx_lower_email`을 사용했다.
