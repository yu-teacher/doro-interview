---
slug: "dbi-12"
topic: "db-index"
tier: DEEP
difficulty: 2
title: "PostgreSQL 플래너는 통계를 어떻게 사용하고, ANALYZE를 안 하면 인덱스 사용에 어떤 문제가 생기나요?"
keywords: ["선택도 추정", "pg_class와 pg_statistic", "ANALYZE로 갱신", "default_statistics_target", "행 수 추정 오류"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/planner-stats.html", "https://www.postgresql.org/docs/16/sql-analyze.html", "https://www.postgresql.org/docs/16/indexes-examine.html"]
concepts: [query-planner]
importance: 2
links: [{to: "dbp-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
플래너는 WHERE 조건이 테이블 행 중 몇 퍼센트를 고를지, 즉 선택도를 추정해서 계획별 비용을 계산하고, 그 재료가 pg_class의 행 수와 페이지 수, 그리고 pg_statistic에 저장된 컬럼 통계입니다. 행 수·페이지 수는 VACUUM이나 ANALYZE가, 컬럼 통계는 ANALYZE가 갱신하며 갱신 직후에도 근사값입니다. 통계가 없거나 오래되어 행 수 추정이 틀리면 인덱스를 놓치거나 비효율적인 계획이 나올 수 있으므로, 데이터가 크게 바뀐 뒤나 인덱스 사용을 점검할 때는 ANALYZE를 먼저 합니다. 분포가 불규칙한 컬럼은 default_statistics_target이나 컬럼별 SET STATISTICS를 올려 정확도를 높이고, 컬럼 간 상관이 있으면 확장 통계를 쓸 수 있습니다.

(공식 문서) 14.2는 플래너가 `pg_class`의 `reltuples`, `relpages`와 `pg_statistic`(읽기 쉬운 뷰가 `pg_stats`)의 컬럼 통계로 WHERE 조건의 선택도를 추정한다고 한다. `pg_class` 값은 VACUUM, ANALYZE, 일부 DDL이 갱신하고, `pg_statistic`은 ANALYZE가 갱신하며 항상 근사값이라고 한다. 통계에 담기는 최빈값과 히스토그램 항목 수의 한도는 `default_statistics_target`(기본 100)이나 `ALTER TABLE ... SET STATISTICS`로 바꿀 수 있고, 컬럼들이 상관되어 있으면 확장 통계(CREATE STATISTICS)를 쓸 수 있다고 한다. 11.12는 통계 없이 인덱스 사용을 점검하는 것은 소용없는 일이라고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`의 `pg_stats`에서 `status`는 `n_distinct = 3`, 최빈값 `{DONE,PAID,NEW}`의 빈도가 0.9504, 0.0392, 0.0104(표본으로 추정한 값)였고 실제 비율은 94.97%, 4.02%, 1.01%였다. autovacuum을 끈 테이블에서 100행으로 ANALYZE한 뒤 `k = 2`인 행 20만 개를 추가하자 `pg_class`는 `reltuples = 100`, `relpages = 1` 그대로였고, 실제 100행인 `k = 1` 조회가 예상 88,600행으로 Seq Scan(4.854 ms)이 되었다. ANALYZE 후에는 예상 133행으로 Index Scan(0.020 ms)이 되었다. 확장 통계는 직접 실행하지 않았다.
