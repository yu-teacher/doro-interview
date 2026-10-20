---
slug: "dbd-10"
topic: "db-design"
tier: DEEP
difficulty: 3
title: "파티셔닝의 장단점은 무엇이고, 파티션이 많을수록 좋은가요?"
keywords: ["파티션 프루닝", "DROP/DETACH로 빠른 삭제", "키 조건이 없으면 모든 파티션 스캔", "파티션 수 과다 시 계획 비용", "큰 테이블에서만 이득"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/ddl-partitioning.html", "https://www.postgresql.org/docs/16/sql-altertable.html"]
---
**모범 답변 (30~60초)**
대표적인 이점은 오래된 데이터를 DROP이나 DETACH PARTITION으로 빠르게 지울 수 있다는 점과, 파티션 키 조건이 있는 쿼리에서 불필요한 파티션을 건너뛰는 파티션 프루닝입니다. 하지만 쿼리에 파티션 키 조건이 없으면 모든 파티션을 훑고, 파티션이 너무 많으면 쿼리 계획 시간과 메모리 사용이 늘어납니다. 공식 문서도 이런 이득은 보통 테이블이 매우 클 때 의미가 있고, 파티션이 많을수록 좋다고 가정하지 말라고 합니다. 그래서 가장 자주 쓰는 WHERE 조건과 삭제 단위에 맞춰 키를 고르고 파티션 수는 절제해서 정합니다.

```sql
EXPLAIN (COSTS OFF) SELECT * FROM logs
 WHERE created_at >= '2026-10-05' AND created_at < '2026-10-10';  -- 10월 파티션만
EXPLAIN (COSTS OFF) SELECT * FROM logs WHERE msg = 'a';          -- 모든 파티션
```

(공식 문서) ddl-partitioning 페이지는 이점으로 일부 파티션에 몰린 쿼리의 성능 향상, 큰 비율을 읽을 때 순차 스캔 활용, DROP TABLE이나 DETACH PARTITION으로 대량 삭제를 훨씬 빠르게 하면서 VACUUM 부담을 피하는 것을 꼽고, 이런 이점은 보통 테이블이 매우 클 때만 값어치가 있으며 대략 테이블 크기가 물리 메모리를 넘을 때가 기준이라고 한다. 파티션 수가 너무 많으면 계획 시간과 메모리 소비가 늘고, 플래너는 대개 수천 개 파티션까지는 프루닝이 잘 되면 다룰 수 있으며, 더 많다고도 더 적다고도 무조건 좋다고 가정하지 말라고 한다. 프루닝은 인덱스가 아니라 파티션 키 제약으로 이루어진다고도 한다. `DROP TABLE`로 파티션을 지우려면 부모에 ACCESS EXCLUSIVE 락이 필요하고, sql-altertable은 `DETACH PARTITION ... CONCURRENTLY`로 락 수준을 낮출 수 있지만 트랜잭션 블록 안에서는 쓸 수 없고 DEFAULT 파티션이 있는 테이블에서는 허용되지 않는다고 한다.
(실험 확인) PostgreSQL 16.15에서 `created_at` 범위 조건 쿼리는 `logs_2026_10` 하나만 Seq Scan했고, 파티션 키가 아닌 `msg = 'a'` 조건은 세 파티션을 모두 Append했다. 이 결과는 이 소량 데이터와 버전에서 나온 계획이다. DEFAULT 파티션이 있는 테이블에 `DETACH PARTITION ... CONCURRENTLY`를 하면 "cannot detach partitions concurrently when a default partition exists" 오류가 났고, 트랜잭션 블록 안에서는 별도 오류가 났으며, DEFAULT 파티션이 없는 테이블에서는 성공했다.
(보충) 파티션 개수나 크기에 대한 구체 기준은 환경 의존이라 단정하지 않는다.
