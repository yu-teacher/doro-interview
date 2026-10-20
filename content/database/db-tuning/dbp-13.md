---
slug: "dbp-13"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "COUNT(*)는 왜 큰 테이블에서 느리고, PostgreSQL과 MySQL(InnoDB)에서 어떻게 다른가요?"
keywords: ["행을 실제로 세어야 함", "가장 작은 인덱스 스캔", "가시성 확인", "통계 추정치", "카운터 테이블"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/planner-stats.html", "https://www.postgresql.org/docs/16/indexes-index-only-scans.html", "https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 SELECT `count(*)`는 미리 저장해 둔 행 수를 읽지 않고 조건에 맞는 행을 실제로 세기 때문에, 큰 테이블에서는 테이블이나 인덱스를 훑는 비용이 듭니다. 인덱스가 있으면 인덱스만 훑는 Index Only Scan으로 셀 수 있지만 가시성 맵 상태에 따라 힙을 읽을 수도 있습니다. MySQL 8.4(InnoDB)도 공식 문서가 밝히듯 동시 트랜잭션마다 보이는 행 수가 달라서 내부 행 수 카운터를 두지 않고, `COUNT(*)`를 가장 작은 보조 인덱스를 훑어 셉니다. 정확한 값이 꼭 필요하지 않으면 통계의 추정치를 쓰거나, 쓰기 경합을 감수하고 카운터 테이블을 따로 둘 수 있습니다.

```sql
-- PostgreSQL 16
EXPLAIN (ANALYZE) SELECT count(*) FROM orders;
-- Index Only Scan using orders_status_idx on orders (rows=500000)  약 30~40ms
SELECT reltuples::bigint FROM pg_class WHERE relname = 'orders';  -- 추정치

-- MySQL 8.4
EXPLAIN ANALYZE SELECT COUNT(*) FROM orders;   -- -> Count rows in orders (약 18~20ms)
```

(공식 문서) MySQL 8.4 집계 함수 문서는 InnoDB가 동시 트랜잭션이 서로 다른 행 수를 볼 수 있어 내부 행 수를 저장하지 않고, `COUNT(*)`는 현재 트랜잭션에서 보이는 행만 세며, WHERE·GROUP BY 같은 추가 절이 없는 SELECT `COUNT(*)` FROM tbl이 단일 스레드 워크로드에 최적화돼 있고, 가장 작은 보조 인덱스를(없으면 클러스터형 인덱스를) 훑는다고 한다. 정확한 값이 필요 없으면 SHOW TABLE STATUS의 근사값을, 빠른 값이 필요하면 카운터 테이블을 쓰라고 하며 `COUNT(*)`와 COUNT(1)은 InnoDB에서 같다고 한다. PostgreSQL 쪽은 planner-stats 문서가 pg_class의 reltuples가 실시간 갱신이 아니라 VACUUM·ANALYZE 등에서 갱신되는 근사값이라고 하고, Index-Only Scans 문서가 가시성 맵에 따라 힙 접근이 필요할 수 있다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 orders에서 `count(*)`는 인덱스 orders_status_idx(이 테이블의 보조 인덱스 중 가장 작은 4,016kB)의 Index Only Scan이었고 29~41ms, `count(id)`는 Seq Scan으로 34~52ms, `WHERE status='PENDING'`은 15만 행에 8ms 안팎이었다(병렬 실행을 끈 세션 기준이고, 기본 설정에서는 Parallel Index Only Scan이 나왔다). 같은 트랜잭션에서 10만 행을 INSERT한 뒤 pg_class.reltuples는 500000 그대로인데 `count(*)`는 600000이었다. MySQL 8.4.11은 `Count rows in orders`(18~20ms)였고, EXPLAIN의 type은 index, key는 orders_customer_idx(Using index)였으며 information_schema의 TABLE_ROWS는 실제 500000과 다른 497268이었다.
(보충) PostgreSQL이 행 수를 저장하지 않는 이유가 MVCC 때문이라는 설명은 위 MySQL 문서의 논리와 같은 일반적 설명이며, 읽은 PostgreSQL 16 공식 문서에서는 이 이유를 직접 서술한 문장을 찾지 못했다. `count(*)`가 인덱스를 고른다는 점과 가장 작은 인덱스가 선택됐다는 점도 문서 서술이 아니라 위 실험에서 관찰한 결과다.
