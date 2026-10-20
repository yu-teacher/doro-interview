---
slug: "dbp-09"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "플래너 통계(pg_stats, ANALYZE)는 무엇이고 통계가 틀리면 어떤 문제가 생기나요?"
keywords: ["행 수와 선택도 추정", "n_distinct와 최빈값", "ANALYZE 갱신", "낡은 통계로 인한 오판", "default_statistics_target"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/planner-stats.html", "https://www.postgresql.org/docs/16/view-pg-stats.html", "https://www.postgresql.org/docs/16/routine-vacuuming.html", "https://www.postgresql.org/docs/16/runtime-config-autovacuum.html", "https://www.postgresql.org/docs/16/runtime-config-query.html", "https://www.postgresql.org/docs/16/sql-analyze.html", "https://www.postgresql.org/docs/16/populate.html"]
concepts: [query-planner]
importance: 2
links: [{to: "dbp-17", kind: FOLLOWUP}, {to: "dbi-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 플래너는 테이블의 행 수와 페이지 수(pg_class의 reltuples, relpages), 컬럼별 null 비율, 고유값 수 n_distinct, 최빈값과 히스토그램 같은 통계(pg_stats로 조회)로 조건의 선택도를 추정해 행 수와 계획을 정합니다. 이 통계는 ANALYZE가 표본으로 갱신하고 autovacuum이 변경량이 쌓이면 자동으로 실행하지만 항상 최신은 아닙니다. 그래서 대량 적재나 값 분포가 크게 바뀐 직후에는 rows 추정이 크게 틀려 엉뚱한 계획이 나올 수 있어 수동 ANALYZE가 필요합니다. 분포가 치우친 컬럼은 default_statistics_target(기본 100)이나 컬럼별 STATISTICS를 올려 더 자세히 모을 수 있습니다.

```sql
ANALYZE orders;
SELECT attname, n_distinct, most_common_vals, most_common_freqs, correlation
FROM pg_stats WHERE tablename = 'orders';
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
```

(공식 문서) Statistics Used by the Planner는 reltuples·relpages가 VACUUM, ANALYZE, CREATE INDEX 같은 일부 DDL에서만 갱신되고, 컬럼별 통계는 pg_statistic(읽기 쉬운 뷰가 pg_stats)에 들어 있으며 ANALYZE가 갱신하고 항상 근사값이라고 한다. pg_stats 뷰 문서는 n_distinct, most_common_vals/freqs, histogram_bounds, correlation을 설명한다. 통계 목표의 기본값은 100이고 올리면 정확도와 ANALYZE 시간이 함께 늘어난다고 한다(runtime-config-query의 default_statistics_target). Routine Vacuuming과 autovacuum 설정 문서에 따르면 autovacuum의 analyze 기준은 autovacuum_analyze_threshold(50) + autovacuum_analyze_scale_factor(0.1) × 행 수이고, ANALYZE 페이지는 autovacuum을 끈 경우 큰 변경 직후에 직접 ANALYZE하는 것이 좋다고 하고, Populating a Database는 대량 적재 뒤 ANALYZE를 강하게 권한다.
(실험 확인) PostgreSQL 16.15, 20만 행 테이블 st(autovacuum을 끈 상태)에서 k=1인 행이 100개뿐일 때, 한 번도 ANALYZE하지 않은 상태의 `WHERE k = 1`은 추정 rows=1000(actual 100)이었다. ANALYZE 후 pg_stats는 `n_distinct=2, most_common_vals={2,1}, most_common_freqs={0.9995,0.0005}`였고 k=1은 Index Scan(rows=100), k=2는 Seq Scan(rows=199900)이 되었다. 그 뒤 10만 행을 k=3으로 바꾸고 ANALYZE 없이 `WHERE k = 3`을 실행하면 추정 rows=1, actual 100000이었고 ANALYZE 후에는 추정이 약 10만(99,707~100,527)이 되었다.
