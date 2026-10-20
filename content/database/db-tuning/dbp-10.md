---
slug: "dbp-10"
topic: "db-tuning"
tier: DEEP
difficulty: 3
title: "Index Only Scan인데 Heap Fetches가 많이 나오는 이유는 무엇인가요?"
keywords: ["인덱스에 가시성 정보 없음", "가시성 맵", "VACUUM이 가시성 맵 갱신", "INCLUDE 커버링 인덱스", "갱신이 잦은 테이블"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-index-only-scans.html", "https://www.postgresql.org/docs/16/routine-vacuuming.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 Index Only Scan은 필요한 컬럼이 모두 인덱스에 있어도, 인덱스 항목에는 가시성 정보가 없어서 그 행이 현재 스냅샷에 보이는지 확인해야 합니다. 그래서 가시성 맵에서 해당 힙 페이지의 모든 행이 보이는 것으로 표시돼 있으면 힙을 읽지 않고, 아니면 힙을 읽으러 가는데 이것이 EXPLAIN의 Heap Fetches입니다. 최근에 갱신이 많았거나 VACUUM이 아직 안 돈 테이블은 Heap Fetches가 커져서 일반 인덱스 스캔과 다를 바 없어지고, VACUUM이 가시성 맵을 갱신해 줍니다. 컬럼을 더 담으려면 INCLUDE로 커버링 인덱스를 만들 수 있지만 인덱스가 커지는 비용이 있습니다.

```sql
CREATE INDEX ios_a_b ON ios (a) INCLUDE (b);   -- b는 검색 키가 아닌 페이로드
VACUUM ios;
EXPLAIN (ANALYZE) SELECT a, b FROM ios WHERE a BETWEEN 10 AND 20;
-- Index Only Scan using ios_a_b ... Heap Fetches: 0
```

(공식 문서) Index-Only Scans and Covering Indexes 절은 인덱스가 값을 저장해야 하고 질의가 인덱스 컬럼만 참조해야 하며, 가시성 정보는 힙에만 있어서 가시성 맵의 비트가 켜진 페이지만 힙 접근을 생략한다고 한다. 따라서 힙 페이지의 상당 부분이 all-visible일 때만 이득이 있다고 하고, INCLUDE 컬럼은 검색 키가 아니며 인덱스를 키우므로 보수적으로 쓰라고 한다. Routine Vacuuming은 VACUUM이 가시성 맵을 갱신해 인덱스 전용 스캔을 가능하게 한다고 한다.
(실험 확인) PostgreSQL 16.15, 20만 행 테이블 ios(autovacuum 끔)에서 VACUUM 전의 `SELECT a ... WHERE a BETWEEN 10 AND 20`은 Bitmap Heap Scan이었고, VACUUM 후에는 Index Only Scan(Heap Fetches: 0, Buffers shared hit=5)이었다. 행의 5%(1만 행)를 UPDATE한 뒤에는 같은 쿼리가 Index Only Scan이면서 `Heap Fetches: 2400`, 버퍼 접근 2,387로 늘었다. a, b를 모두 읽는 쿼리는 Bitmap Heap Scan이었고, `INCLUDE (b)` 인덱스를 만들고 VACUUM하자 Index Only Scan(Heap Fetches 0)이 되었으며 인덱스는 1,752kB에서 4.4~4.6MB로 커졌다(두 번 만들어 본 값이며 이 데이터에서의 크기다).
(보충) EXPLAIN 출력의 Heap Fetches 항목이 인덱스 전용 스캔이 힙을 실제로 방문한 횟수라는 설명은 읽은 PostgreSQL 16 문서에서 정의한 문장을 찾지 못했다. VACUUM 후 0, 행 5% 갱신 후 2,400으로 달라지고 힙 방문이 늘 때 버퍼 접근도 늘어난 위 실험 결과로 확인한 해석이다.
