---
slug: "dbp-16"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "슬로우 쿼리는 어떻게 찾나요?"
keywords: ["log_min_duration_statement", "pg_stat_statements", "shared_preload_libraries", "총 실행 시간 순", "slow query log와 Performance Schema"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/runtime-config-logging.html", "https://www.postgresql.org/docs/16/pgstatstatements.html", "https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html", "https://dev.mysql.com/doc/refman/8.4/en/performance-schema-statement-summary-tables.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 두 가지를 함께 씁니다. log_min_duration_statement를 설정하면 지정한 시간 이상 걸린 문장이 서버 로그에 남고, pg_stat_statements 확장은 정규화한 쿼리별로 호출 수, 총·평균 실행 시간, 블록 접근 통계를 모아 줍니다. pg_stat_statements는 shared_preload_libraries에 넣고 서버를 재시작해야 하고 CREATE EXTENSION도 해야 합니다. 개별로는 빠르지만 호출이 아주 많은 쿼리는 로그 임계값에 안 걸리므로 total_exec_time 순으로 보는 게 유용합니다. 찾은 쿼리는 EXPLAIN (ANALYZE, BUFFERS)로 원인을 봅니다. MySQL 8.4에서는 slow query log와 Performance Schema의 다이제스트 요약 테이블이 같은 역할을 합니다.

```sql
SET log_min_duration_statement = '20ms';   -- 로그: duration: 85.499 ms  statement: ...
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 5;
```

(공식 문서) PostgreSQL 로깅 문서는 log_min_duration_statement가 지정 시간 이상 걸린 문장의 소요 시간을 기록하며 기본 -1은 끔이고 최적화되지 않은 쿼리를 찾는 데 도움이 된다고 한다. pg_stat_statements 문서는 모듈을 shared_preload_libraries에 넣어야 하고 서버 재시작이 필요하며, 뷰에 queryid, calls, total_exec_time, mean_exec_time, rows, shared_blks_hit/read 등이 있다고 하고 예제가 total_exec_time 순으로 조회한다. MySQL 8.4 문서는 slow query log가 long_query_time보다 오래 걸린 문장을 기록하고 log_queries_not_using_indexes로 인덱스를 안 쓰는 쿼리도 남길 수 있다고 하며, Performance Schema의 events_statements_summary_by_digest가 스키마·다이제스트별로 실행 통계를 요약한다고 한다.
(실험 확인) PostgreSQL 16.15 컨테이너에서 pg_stat_statements를 CREATE EXTENSION한 뒤 조회하면 `pg_stat_statements must be loaded via shared_preload_libraries` 오류가 났다(이 컨테이너는 preload가 비어 있어서 확장을 실제로 켜 보지는 않았다). 세션에서 `SET log_min_duration_statement='20ms'` 후 자기 조인 쿼리를 실행하자 `LOG: duration: 85.499 ms statement: SELECT count(*) FROM orders a JOIN orders b ...`가 서버 로그에 남았다(처음 실행에서는 48.905ms였다. 같은 쿼리도 실행마다 시간이 달라진다). MySQL 8.4.11에서는 slow_query_log=OFF, long_query_time=10.000000이 기본이었고 performance_schema의 events_statements_summary_by_digest에서 쿼리 패턴별 count_star와 합계 시간을 볼 수 있었다.
(보충) 호출이 많은 쿼리가 로그 임계값에 안 걸린다는 점과 total_exec_time으로 정렬해 보는 운영 요령은 일반적인 실무 설명이다.
