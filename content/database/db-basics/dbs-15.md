---
slug: "dbs-15"
topic: "db-basics"
tier: DEEP
difficulty: 2
title: "금액 컬럼에 float 대신 numeric(DECIMAL)을 쓰라는 이유는 무엇인가요?"
keywords: ["float는 근사값", "numeric은 정확한 값", "금액에는 numeric", "전체 자릿수와 소수 자릿수", "numeric 연산은 상대적으로 느림"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/datatype-numeric.html", "https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html"]
concepts: [numeric-precision, schema-design]
importance: 2
---
**모범 답변 (30~60초)**
float나 double precision 같은 부동소수점 타입은 값을 이진수로 근사해 저장하기 때문에 0.1처럼 정확히 표현되지 않는 수가 있고, 더하면 미세한 오차가 생길 수 있어 동등 비교가 깨질 수 있습니다. numeric은 자릿수를 지정한 정확한 십진수라 덧셈, 뺄셈, 곱셈 결과가 가능한 한 정확해서 금액처럼 정확해야 하는 값에 권장됩니다. 대신 numeric 연산은 정수나 부동소수점보다 느립니다. `numeric(10,2)`처럼 전체 자릿수와 소수 자릿수를 지정하면 소수 자릿수를 넘는 값은 반올림되고 정수부가 넘치면 오류가 납니다. PostgreSQL 16 기준이고 MySQL 8.4에서는 DECIMAL이 같은 역할을 합니다.

```sql
SELECT 0.1::float8 + 0.2::float8 = 0.3::float8 AS f_eq,   -- false (0.30000000000000004)
       0.1::numeric + 0.2::numeric = 0.3::numeric AS n_eq; -- true
```

(공식 문서) PostgreSQL 16 datatype-numeric 페이지는 numeric이 금액처럼 정확해야 하는 값에 특히 권장되고 정수나 부동소수점보다 연산이 매우 느리다고 설명한다. precision과 scale을 설명하고, 소수 자릿수가 많으면 반올림하며 정수부가 넘치면 오류라고 한다. real과 double precision은 부정확한 가변 정밀도 타입이라 정확한 저장과 계산이 필요하면 numeric을 쓰라고 한다. MySQL 8.4 fixed-point-types 페이지는 DECIMAL과 NUMERIC이 정확한 값을 저장하며 금액 같은 데이터에 쓴다고 하고, 소수 자릿수가 초과된 값은 운영체제에 따라 다르지만 보통 잘려서 변환된다고 적는다.
(실험 확인) PostgreSQL 16.15에서 `float8`의 0.1 + 0.2는 0.30000000000000004로 0.3과 같지 않았고, 0.1을 열 번 더한 `float8` 합은 0.9999999999999999로 1.0과 달랐지만 `numeric`은 1.0과 같았다. `numeric(10,2)`에 1.005는 1.01로 저장되었고 100000000은 `numeric field overflow` 오류였다. `round(2.5)`는 `numeric`이 3, `float8`이 2였다. `real`(4바이트)로는 `0.1 + 0.2 = 0.3`이 true로 나왔다. MySQL 8.4.11도 `0.1e0 + 0.2e0`은 0.30000000000000004로 0.3과 달랐고 DECIMAL 합은 같았으며, `decimal(10,2)`에 100000000은 범위 초과 오류(1264)였고, 1.005는 문서의 "보통 잘린다"와 달리 1.01로 저장되었다.
