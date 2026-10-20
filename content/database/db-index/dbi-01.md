---
slug: "dbi-01"
topic: "db-index"
tier: BASIC
difficulty: 1
title: "인덱스는 왜 필요하고, PostgreSQL에서 CREATE INDEX를 하면 기본으로 어떤 인덱스가 만들어지나요?"
keywords: ["테이블 전체 스캔 회피", "기본 B-tree", "플래너가 비용으로 선택", "ANALYZE 통계", "쓰기 시 동기화 비용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-intro.html", "https://www.postgresql.org/docs/16/indexes-types.html", "https://www.postgresql.org/docs/16/indexes-examine.html"]
concepts: [index-structure]
importance: 3
links: [{to: "dbi-02", kind: FOLLOWUP}, {to: "dbi-04", kind: FOLLOWUP}, {to: "dbi-07", kind: FOLLOWUP}, {to: "dbp-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
인덱스는 WHERE나 JOIN 조건에 맞는 행을 테이블 전체를 훑지 않고 찾도록 따로 유지하는 자료구조입니다. PostgreSQL 16에서 CREATE INDEX는 따로 지정하지 않으면 B-tree를 만들고, 한번 만들면 테이블이 바뀔 때마다 시스템이 인덱스를 알아서 갱신합니다. 다만 인덱스가 있다고 항상 쓰이지는 않고, 플래너가 통계를 보고 순차 스캔보다 싸다고 판단할 때만 쓰므로 ANALYZE로 통계를 갱신해 줘야 할 수 있습니다. 인덱스는 쓰기 때마다 동기화 비용이 들기 때문에 거의 안 쓰는 인덱스는 지우는 것이 좋습니다.

```sql
CREATE INDEX orders_user_idx ON orders (user_id);
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF) SELECT * FROM orders WHERE user_id = 777;
```

(공식 문서) Indexes 장 11.1은 인덱스가 없으면 시스템이 테이블을 행 단위로 전부 스캔해야 하지만, 인덱스가 있으면 검색 트리를 몇 단계만 내려가 찾을 수 있다고 설명한다. 인덱스는 테이블 변경 시 시스템이 갱신하고, 더 효율적이라고 판단할 때 사용하며, 올바른 판단을 위해 ANALYZE를 정기적으로 돌려야 할 수 있다고 한다. 인덱스는 UPDATE·DELETE의 검색 조건과 조인에도 도움이 되고, 데이터 변경 때 동기화 오버헤드를 더하며 heap-only tuple 생성을 막을 수 있어 거의 안 쓰는 인덱스는 제거하라고 한다. 11.2는 CREATE INDEX가 기본으로 B-tree를 만든다고 한다. 11.12는 인덱스 사용을 점검하기 전에 항상 ANALYZE를 먼저 하라고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개짜리 `orders` 테이블에서 조건에 맞는 행이 101개인 `user_id = 777`은 인덱스가 없을 때 Seq Scan(버퍼 2,439개 접근, 5.791 ms)이었고, 인덱스를 만든 뒤에는 Bitmap Index Scan과 Bitmap Heap Scan(버퍼 102개, 0.143 ms)이었다. 행 수와 시간은 난수로 만든 이 데이터·환경에서 나온 값이다. 방금 만든 인덱스에 B-tree 전용 함수 `bt_metap`이 동작했고 `pg_am`에서 접근 방법을 조회하면 `btree`로 나와 기본 생성 인덱스가 B-tree임을 확인했다.
