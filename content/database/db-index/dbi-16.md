---
slug: "dbi-16"
topic: "db-index"
tier: TRICKY
difficulty: 3
title: "WHERE 절의 컬럼에 함수, 연산, 형 변환을 쓰면 왜 인덱스를 못 타고 어떻게 고치나요?"
keywords: ["인덱스 컬럼 연산자 비교값 형태", "컬럼을 가공하지 말고 상수 쪽을 가공", "범위 조건으로 재작성", "암묵적 형 변환", "표현식 인덱스"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.postgresql.org/docs/16/indexes-intro.html", "https://www.postgresql.org/docs/16/indexes-expressional.html", "https://dev.mysql.com/doc/refman/8.4/en/type-conversion.html"]
concepts: [index-design]
importance: 3
links: [{to: "dbi-02", kind: PREREQ}, {to: "dbi-11", kind: PREREQ}, {to: "dbp-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
인덱스는 컬럼 값 자체, 또는 인덱스를 정의할 때 쓴 식에 대해 정렬되어 있습니다. PostgreSQL 16 문서에 따르면 인덱스를 쓰려면 조건이 인덱스 컬럼, 인덱스 연산자 클래스에 속한 연산자, 비교값 형태여야 합니다. created_at::date = '2026-06-01'이나 amount + 1 = 500처럼 컬럼 쪽에 변환을 씌우면 인덱스에 저장된 값과 바로 비교할 수 없어서 못 씁니다. 해법은 변환을 상수 쪽으로 옮겨 amount = 499로 쓰거나 하루치 범위 조건으로 바꾸는 것이고, 꼭 필요하면 그 식 자체로 표현식 인덱스를 만듭니다. int 컬럼을 numeric 상수와 비교해 컬럼에 암묵적 형 변환이 붙는 경우도 같습니다. MySQL 8.4(InnoDB)도 실험에서는 DATE(created_at) 조건이 인덱스를 못 썼습니다.

```sql
-- 못 탄다(컬럼 쪽 변환)                      -- 탄다(상수 쪽/범위)
WHERE created_at::date = '2026-06-01'         WHERE created_at >= '2026-06-01' AND created_at < '2026-06-02'
WHERE amount + 1 = 500                        WHERE amount = 499
```

(공식 문서) 11.1은 PostgreSQL 인덱스가 `indexed-column indexable-operator comparison-value` 형태의 WHERE·JOIN 절을 최적화할 수 있고, 인덱스 컬럼은 인덱스가 정의된 컬럼 또는 식이며 연산자는 그 컬럼의 연산자 클래스 소속이어야 하고 비교값은 volatile이 아니며 인덱스 테이블을 참조하지 않는 식이어야 한다고 한다. 11.7은 식에 대한 인덱스를 만들면 쿼리가 `WHERE indexedcolumn = 'constant'`로 보여 검색이 단순 인덱스 쿼리와 같다고 한다. MySQL 8.4 문서에서는 컬럼에 함수를 씌우면 인덱스를 못 쓴다는 일반 문장을 찾지 못했고(타입 변환 페이지에 문자열 컬럼을 숫자와 비교하면 인덱스를 못 쓴다는 사례만 있다), 함수에 대한 MySQL 쪽 결과는 아래 실험에서만 확인했다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `created_at::date = '2026-06-01'`(720행)은 Seq Scan(7.836 ms, 버퍼 2,439개), 하루 범위 조건은 Index Scan(0.095 ms, 버퍼 15개)이었다. `amount + 1 = 500`은 Seq Scan, `amount = 499`는 인덱스를 썼다. `int` 컬럼 `user_id = 777.0`은 계획에 `(user_id)::numeric = 777.0` 필터가 붙은 Seq Scan이었고 `user_id = 777::bigint`는 인덱스를 썼다. `((created_at::date))` 표현식 인덱스를 만들면 `created_at::date = '2026-06-01'`도 Index Scan이 되었다. MySQL 8.4.11에서 `DATE(created_at) = '2026-06-01'`은 `type: ALL`(예상 199,171행), 같은 하루 범위 조건은 `range`(720행)였고, 문자열 컬럼 `email = 777`은 `possible_keys`에 인덱스가 보여도 `key: NULL`로 전체 스캔, `email = '777'`은 `ref`였다.
(보충) 컬럼 쪽 암묵적 형 변환이 인덱스를 막는 일반 원리는 위 문서 설명에서 이끌어 낸 것이고, 모든 형 변환이 막는 것은 아니다(`bigint` 상수는 위 실험에서 인덱스를 썼다). MySQL 8.4(InnoDB)에서 컬럼 쪽 함수가 인덱스를 막는다는 것도 문서가 아니라 실험 결과에 근거한다.
