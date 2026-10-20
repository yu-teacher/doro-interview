---
slug: "dbp-04"
topic: "db-tuning"
tier: BASIC
difficulty: 1
title: "인덱스를 만들었는데 쿼리가 인덱스를 타지 않는 이유는 무엇인가요?"
keywords: ["비용 비교로 순차 스캔 선택", "컬럼에 함수 적용", "표현식 인덱스", "타입 캐스팅", "작은 테이블"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/indexes-expressional.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 플래너는 인덱스가 있어도 비용을 비교해서 순차 스캔이 더 싸다고 판단하면 인덱스를 쓰지 않습니다. 조건에 맞는 행이 테이블의 큰 비율이거나 테이블이 아주 작으면 그렇습니다. 또 컬럼에 함수나 연산을 씌우면, 예를 들어 created_at::date = '2026-01-05'나 id + 0 = 42처럼 쓰면 컬럼 값 자체로 인덱스를 찾을 수 없어서 못 탑니다. 이 경우 범위 조건으로 바꾸거나 그 표현식에 인덱스를 만들어야 합니다. 비교를 위해 컬럼이 캐스팅되는 타입 불일치도 같은 문제를 일으킵니다. 일단 EXPLAIN으로 실제 계획과 Filter 줄을 확인하는 게 순서입니다.

```sql
-- 인덱스를 탐: 컬럼은 그대로 두고 범위로 비교
WHERE created_at >= '2026-01-05' AND created_at < '2026-01-06'
-- 인덱스를 못 탐: 컬럼에 연산/캐스팅
WHERE created_at::date = '2026-01-05'
WHERE customer_id = 77::numeric
-- 표현식 인덱스로 해결(함수가 IMMUTABLE이어야 함)
CREATE INDEX ON orders (((created_at AT TIME ZONE 'UTC')::date));
```

(공식 문서) Using EXPLAIN의 Caveats는 페이지 하나짜리 테이블에서는 인덱스가 있어도 거의 항상 순차 스캔이 나온다고 하고, 플래너가 비용을 비교해 계획을 고른다고 설명한다. Indexes on Expressions 절은 lower(col1) = 'value' 같은 조건에 lower(col1)에 대한 인덱스를 만들면 쓸 수 있고 표현식은 행 삽입과 HOT이 아닌 갱신 때마다 계산되므로 유지 비용이 들지만 검색 때는 다시 계산하지 않는다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 orders 테이블에서 created_at 범위 조건은 Index Only Scan(실행 1~3ms대), `created_at::date = ...`는 Seq Scan(Rows Removed by Filter 48만 2,720, 실행 28~38ms대), `id + 0 = 42`도 Seq Scan이었다. `customer_id = 77::numeric`은 `(customer_id)::numeric` 필터의 Seq Scan, `77::bigint`는 인덱스를 썼다. 100행짜리 테이블의 PK 조회는 Seq Scan이었고, 70%가 걸리는 status = 'PAID'도 Seq Scan이었다. `(created_at::date)` 표현식 인덱스는 `functions in index expression must be marked IMMUTABLE` 오류로 만들어지지 않았다. pg_cast·pg_proc에서 timestamptz→date 변환 함수의 provolatile은 `s`(STABLE)였고, 같은 시각 `2026-01-05 00:30:00+00`을 `::date`로 바꾸면 세션 시간대가 UTC일 때 2026-01-05, America/Los_Angeles일 때 2026-01-04가 나왔다. `AT TIME ZONE 'UTC'`를 넣은 표현식 인덱스를 만들면 같은 조건이 Index Scan이 되었다.
(보충) 컬럼에 함수·연산을 씌우면 그 컬럼의 일반 인덱스를 쓰지 못하고, 타입 불일치로 컬럼이 캐스팅될 때도 마찬가지라는 일반 규칙은 위 읽은 문서가 직접 서술한 것이 아니라 위 실험 결과(Seq Scan)에 근거한 설명이다. IMMUTABLE 오류의 원인이 시간대 의존이라는 설명도 위 두 실험 결과로 보이는 해석이며 변동성 범주를 다루는 문서는 읽지 않았다.
