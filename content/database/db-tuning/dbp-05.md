---
slug: "dbp-05"
topic: "db-tuning"
tier: BASIC
difficulty: 2
title: "Nested Loop, Hash Join, Merge Join은 어떻게 다르고 언제 쓰이나요?"
keywords: ["바깥 행마다 안쪽 탐색", "해시 테이블 빌드와 프로브", "정렬된 입력 병합", "인덱스 없는 등가 조인", "비용 기반 선택"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/using-explain.html", "https://www.postgresql.org/docs/16/runtime-config-query.html", "https://dev.mysql.com/doc/refman/8.4/en/nested-loop-joins.html", "https://dev.mysql.com/doc/refman/8.4/en/hash-joins.html"]
concepts: [join-query, query-planner]
importance: 3
links: [{to: "dbs-03", kind: RELATED}, {to: "dbs-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
Nested Loop는 바깥 테이블의 행마다 안쪽 테이블을 한 번씩 찾는 방식이라, 바깥 행이 적고 안쪽에 조인 키 인덱스가 있을 때 좋습니다. Hash Join은 한쪽을 해시 테이블로 만들고 다른 쪽을 읽으며 맞는 행을 찾는 방식으로 등가 조인에서 쓰이고 두 쪽이 모두 큰 경우에 흔합니다. Merge Join은 양쪽을 조인 키로 정렬한 뒤 한 번씩 훑으며 합치는 방식이라 이미 정렬돼 있거나 인덱스로 순서를 얻을 수 있을 때 유리합니다. PostgreSQL 16은 이 셋을 모두 두고 비용으로 고르고, MySQL 8.4(InnoDB)는 인덱스를 쓰는 중첩 루프와, 인덱스가 없는 조인에는 해시 조인을 씁니다.

| 구분 | PostgreSQL 16 | MySQL 8.4(InnoDB) |
|---|---|---|
| Nested Loop | 선택지 중 하나. 안쪽에 인덱스 스캔 | 기본 조인 방식. 안쪽은 인덱스 조회 |
| Hash Join | 등가 조인에서 선택. work_mem 초과 시 배치로 분할 | 인덱스 없는 조인에 사용. join_buffer_size 초과 시 디스크 사용 |
| Merge Join | 선택지 중 하나 | 읽은 8.4 문서(중첩 루프·해시 조인 절)에 설명 없음 |

(공식 문서) Using EXPLAIN 페이지는 세 방식을 각각 예와 함께 설명한다. 중첩 루프는 바깥 자식을 읽고 안쪽 자식을 바깥 행마다 실행하며, 해시 조인은 한쪽 행을 메모리 해시 테이블에 넣고 다른 쪽으로 탐색하고, 머지 조인은 입력이 조인 키로 정렬돼 있어야 한다. 플래너가 고른 계획은 enable_hashjoin 같은 플래그로 억제해 비교해 볼 수 있다. MySQL 8.4 문서는 조인을 중첩 루프로 실행한다고 하고, 해시 조인 절은 조인 조건에 쓸 인덱스가 없는 등가 조인에 해시 조인을 쓰며(비등가·카티션 곱에도 적용), join_buffer_size를 넘으면 디스크 파일을 쓴다고 한다. 해당 문서들에는 머지 조인 설명이 없다.
(실험 확인) PostgreSQL 16.15, orders 50만 행 × customers 1만 행. `c.id < 5` 조건 조인은 Nested Loop(안쪽 Bitmap Heap Scan loops=4)이었고, 전체 조인 후 집계는 Hash Join(Batches 1)이었다. enable_hashjoin·enable_nestloop을 끄면 Merge Join(양쪽 Index Scan), enable_hashjoin·enable_mergejoin을 끄면 Nested Loop(Memoize)가 나왔고, 각각 한 번 잰 시간(psql \timing)은 해시 56~63ms, 머지 203~206ms, 중첩 루프 80~83ms였다(두 번 재 본 범위이고 이 데이터·환경의 값이라 순위를 일반화하지 않는다). MySQL 8.4.11에서는 customer_id 인덱스가 있는 조인이 `Nested loop inner join` + `Index lookup`(loops=10000)이었고, 인덱스 없는 컬럼의 조인(1만×1만 행)은 `Inner hash join`으로 약 5ms였는데 optimizer_switch의 block_nested_loop를 off로 해시 조인을 끄자 같은 쿼리가 약 8~10초 걸렸다(단순 중첩 루프로 1만 번 전체 스캔).
(보충) 각 알고리즘이 유리한 조건(바깥 행이 적을 때, 입력이 정렬돼 있을 때 등)은 알고리즘 원리에서 오는 일반적 설명이며 문서가 수치로 기준을 제시한 것은 아니다. PostgreSQL의 해시 조인이 등가 조인에서만 쓰인다는 설명도 읽은 PostgreSQL 16 문서에서 직접 서술을 찾지 못했고, 비등가 조인(`a.id < b.id`)이 Nested Loop로 나온 위 실험과 일치하는 정도로만 확인했다.
