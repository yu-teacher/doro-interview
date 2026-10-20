---
slug: "dbp-15"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "work_mem과 shared_buffers는 각각 무엇이고 어떻게 잡나요?"
keywords: ["연산 단위 메모리", "임시 파일로 넘침", "hash_mem_multiplier", "공유 버퍼 캐시", "RAM의 25%"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/runtime-config-resource.html", "https://www.postgresql.org/docs/16/using-explain.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 work_mem은 정렬이나 해시 테이블 같은 쿼리 연산 하나가 임시 파일로 넘어가기 전에 쓸 수 있는 메모리이고 기본은 4MB입니다. 연산 단위라서 복잡한 쿼리는 여러 개를 동시에 쓰고 동시 세션도 곱해지므로, 올릴 때는 총 메모리를 따져야 합니다. 해시 연산은 work_mem에 hash_mem_multiplier(기본 2.0)를 곱한 한도를 씁니다. shared_buffers는 테이블과 인덱스 블록을 캐시하는 공유 메모리로 기본 128MB이고, 전용 서버라면 RAM의 25% 정도를 시작값으로 보고 40%를 넘기면 효과가 적을 것이라고 문서가 안내합니다. MySQL 8.4(InnoDB)의 대응은 innodb_buffer_pool_size로, 전용 서버에서는 물리 메모리의 80%까지 잡기도 합니다.

```sql
SET work_mem = '128MB';   -- 세션 단위로만 올려 볼 수 있다
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders ORDER BY amount, id;
-- Sort Method: external merge  Disk: 41800kB   (4MB일 때)
-- Sort Method: quicksort  Memory: 64246kB      (128MB일 때)
```

(공식 문서) Resource Consumption 문서는 work_mem이 정렬(ORDER BY, DISTINCT, 머지 조인)과 해시(해시 조인, 해시 집계, memoize 등)에 쓰이는 메모리의 기본 한도이며 여러 연산과 여러 세션이 동시에 쓰면 총량이 몇 배가 될 수 있다고 한다. 해시 테이블 한도는 work_mem × hash_mem_multiplier(기본 2.0)이다. shared_buffers는 전용 서버(RAM 1GB 이상)에서 RAM의 25%가 합리적인 시작값이고, 운영체제 캐시도 쓰기 때문에 40%를 넘으면 더 낫기 어렵다고 하며 서버 시작 시에만 바꿀 수 있다. MySQL 8.4 문서는 innodb_buffer_pool_size 기본이 128MB이고 전용 서버에서는 물리 메모리의 80%까지 설정할 수 있다고 한다. Using EXPLAIN은 Sort 노드가 정렬을 메모리나 디스크에서 했는지, Hash 노드가 버킷·배치 수와 메모리 사용량을 보여 준다고 한다.
(실험 확인) PostgreSQL 16.15, 50만 행 orders 전체를 `ORDER BY amount, id`로 정렬하면 work_mem 4MB에서 `Sort Method: external merge Disk: 41800kB`(temp read=10449 written=10465 블록), 128MB에서 `quicksort Memory: 64246kB`였다. orders 자기 조인의 해시 조인은 4MB에서 `Batches: 4, Memory Usage: 6928kB`(work_mem 4MB × 2 이내), 128MB에서 `Batches: 1, Memory Usage: 23628kB`였다. 이 환경은 데이터가 캐시에 있어서 실행 시간 차는 작았다(두 번 실행한 값으로 정렬 약 210~250ms 대 210~230ms, 해시 조인 약 140~160ms 대 135~150ms).
