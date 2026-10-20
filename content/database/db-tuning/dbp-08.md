---
slug: "dbp-08"
topic: "db-tuning"
tier: DEEP
difficulty: 2
title: "EXPLAIN (ANALYZE, BUFFERS)에서 actual rows, loops, shared hit/read는 어떻게 해석하나요?"
keywords: ["loops 곱하기", "추정 행 수와 실제 행 수 비교", "LIMIT으로 중단된 노드", "shared hit과 read", "임시 파일 블록"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/sql-explain.html", "https://www.postgresql.org/docs/current/sql-explain.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 actual time과 rows는 loops가 2 이상이면 한 번 실행당 평균이라서, 노드가 쓴 총 시간과 행 수는 loops를 곱해서 봐야 합니다. 먼저 볼 것은 추정 rows와 actual rows가 크게 어긋나는지인데, LIMIT 때문에 중간에 멈춘 노드는 어긋나 보여도 오류가 아닙니다. BUFFERS의 shared hit은 공유 버퍼에서 바로 찾은 블록 수, read는 공유 버퍼에 없어서 읽어 온 블록 수이고, temp read/written은 정렬이나 해시가 work_mem을 넘어 쓴 임시 파일 블록입니다. 상위 노드의 수치는 하위 노드를 포함하니 노드별로 내려가며 I/O가 어디서 생기는지 봅니다.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT c.name, o.amount FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.id < 5;
-- Bitmap Heap Scan on orders o ... (actual time=0.024..0.037 rows=50 loops=4)
--   Heap Blocks: exact=200   Buffers: shared hit=12 read=206   (첫 실행, 캐시가 비었을 때)
```

(공식 문서) Using EXPLAIN은 loops가 노드의 총 실행 횟수이고 actual time과 rows는 실행당 평균이므로 loops를 곱해야 총 시간이 나오며, 추정 행 수가 실제와 가까운지가 보통 가장 중요하다고 한다. LIMIT처럼 노드 실행이 중간에 멈춰서 추정과 실제가 달라 보이는 것은 오류가 아니라고 한다. EXPLAIN 페이지의 BUFFERS 설명은 hit이 캐시에서 찾아 읽기를 피한 경우이고, shared는 일반 테이블·인덱스, temp는 정렬·해시·Materialize 같은 단기 작업 데이터라고 하며, track_io_timing을 켜면 읽기·쓰기 시간도 보여 준다고 한다. 버전 차이로, 현재 버전(18) 문서에는 ANALYZE를 쓰면 BUFFERS 정보가 자동으로 포함된다고 적혀 있어 16에서와 달리 옵션을 따로 주지 않아도 된다.
(실험 확인) PostgreSQL 16.15에서 위 쿼리는 안쪽 Bitmap Heap Scan이 `rows=50 loops=4`였고 총 200행이다. 이 노드의 Buffers는 shared hit=12 read=206(합 218)인데, 자식인 Bitmap Index Scan의 18(hit=12 read=6)을 빼면 Heap Blocks exact=200과 같아서 상위 노드 수치가 자식 노드를 포함함을 확인할 수 있었다(다른 테이블을 크게 써서 캐시를 밀어낸 뒤의 첫 실행). 같은 쿼리를 다시 실행하면 read가 0이고 hit이 221(최상위 노드 합계는 첫 실행의 hit=14 read=207과 같은 221)이었다. `WHERE customer_id < 5000 LIMIT 3`은 추정 rows가 약 25만(24만 8천~24만 9천)인 Seq Scan 노드의 actual이 rows=3이었다. track_io_timing을 켠 세션에서 207블록 read에 `I/O Timings: shared read=1.188`ms가 나왔다. 50만 행 정렬이 work_mem 4MB를 넘으면 `temp read=10449 written=10465`가 찍혔다(dbp-15 참고).
(보충) shared read가 디스크에서 읽은 것인지 운영체제 캐시에서 온 것인지는 EXPLAIN만으로 구분되지 않는다. 위 207블록이 1ms 남짓에 읽힌 점으로 보아 이 실험에서는 OS 캐시에서 온 것으로 추정된다.
