---
slug: "dbp-17"
topic: "db-tuning"
tier: TRICKY
difficulty: 3
title: "WHERE 조건의 컬럼들이 서로 종속돼 있으면 플래너 추정이 왜 틀리고, CREATE STATISTICS는 무엇을 해결하나요?"
keywords: ["조건 독립 가정", "컬럼 간 종속", "확장 통계", "dependencies와 ndistinct", "등호 조건에만 적용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/planner-stats.html", "https://www.postgresql.org/docs/16/sql-createstatistics.html"]
concepts: [query-planner]
importance: 1
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 플래너는 기본적으로 WHERE의 여러 조건이 서로 독립이라고 가정하고 각 조건의 선택도를 곱합니다. 그런데 city와 zip처럼 한 컬럼이 다른 컬럼을 결정하는 식으로 종속돼 있으면 실제보다 훨씬 적은 행이 나올 것으로 추정해서 엉뚱한 계획을 고를 수 있습니다. 이때 CREATE STATISTICS로 의존성(dependencies), 고유값 조합(ndistinct), 다변량 MCV 같은 확장 통계를 만들고 ANALYZE하면 추정이 개선됩니다. 다만 의존성 통계는 상수와의 등호 조건 등에만 적용되고 범위 조건에는 쓰이지 않으며, 모든 조합에 자동으로 만들어지지 않으니 문제가 되는 컬럼 조합에만 만듭니다.

```sql
CREATE STATISTICS addr_dep (dependencies, ndistinct) ON city, zip FROM addr;
ANALYZE addr;
EXPLAIN (ANALYZE) SELECT * FROM addr WHERE city = 5 AND zip = 50;
```

(공식 문서) Extended Statistics 절은 플래너가 여러 조건을 독립으로 가정하며 컬럼 간 상관이 있으면 단일 컬럼 통계로는 이를 알 수 없다고 한다. 통계 객체는 CREATE STATISTICS로 만들고 실제 수집은 ANALYZE가 하며(CREATE STATISTICS 페이지는 독립 가정이면 선택도를 곱해 행 수가 너무 작게 추정된다고 설명한다), 함수 종속(dependencies), 다변량 n-distinct, 다변량 MCV 종류가 있다고 한다. 함수 종속은 상수와의 등호 조건과 상수 IN 목록에만 적용되고 범위·LIKE에는 적용되지 않으며, 조건이 서로 맞지 않는 값 조합(실제로는 0행)을 구분하지 못한다. 상관이 강한 컬럼 조합에만 만들라고 권한다.
(실험 확인) PostgreSQL 16.15, 30만 행 테이블 addr(city = g%100, `zip = city*10 + g%3`, 각 컬럼에 인덱스, ANALYZE 후). 확장 통계 전에 `WHERE city = 5 AND zip = 50`은 추정 rows=10, actual 1000이었고 `GROUP BY city, zip`은 추정 30000(actual 300 그룹)이었다. `CREATE STATISTICS ... (dependencies, ndistinct)`와 ANALYZE 뒤에는 각각 추정 995와 300이 되었고 `pg_statistic_ext_data`에는 `{"3 => 2": 1.000000}`, `{"2, 3": 300}`이 들어 있었다. 범위 조건 `city = 5 AND zip < 60`은 통계를 만든 뒤에도 추정 175~186, actual 3000으로 개선되지 않았다.
