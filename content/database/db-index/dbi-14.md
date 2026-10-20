---
slug: "dbi-14"
topic: "db-index"
tier: DEEP
difficulty: 2
title: "PostgreSQL의 B-tree, Hash, GIN, GiST, BRIN 인덱스는 각각 언제 쓰나요?"
keywords: ["B-tree 동등·범위·정렬", "Hash는 동등 비교만", "GIN 역색인", "GiST 확장 가능한 틀", "BRIN 블록 범위 요약"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-types.html", "https://www.postgresql.org/docs/16/brin-intro.html", "https://www.postgresql.org/docs/16/gin-intro.html", "https://www.postgresql.org/docs/16/indexes-multicolumn.html"]
---
**모범 답변 (30~60초)**
B-tree는 기본값으로 정렬할 수 있는 데이터의 동등, 범위, 정렬 조회에 씁니다. Hash는 32비트 해시 값을 저장해서 동등 비교만 처리합니다. GiST는 기하 타입의 포함이나 가장 가까운 이웃 검색처럼 여러 전략을 구현할 수 있는 틀이고, GIN은 배열이나 문서처럼 여러 요소로 이루어진 값에서 특정 요소가 들어 있는지를 찾는 역색인입니다. BRIN은 테이블의 연속된 블록 범위마다 최솟값과 최댓값 같은 요약만 저장해서, 값이 물리적 저장 순서와 상관관계가 높은 아주 큰 테이블에서 작은 인덱스로 블록을 건너뛰게 합니다. 인덱스 종류마다 지원하는 연산자와 기능이 다릅니다.

(공식 문서) Index Types 절(11.2)은 B-tree, Hash, GiST, SP-GiST, GIN, BRIN과 확장 bloom을 소개한다. Hash는 32비트 해시 코드를 저장해 동등 비교만 처리하고, GiST는 연산자 클래스에 따라 지원 연산자가 달라지는 인프라로 최근접 이웃 정렬도 가능하다. GIN은 배열처럼 여러 구성 값을 가진 데이터를 위한 역색인으로 각 구성 값마다 항목이 있고 특정 값의 존재를 묻는 쿼리를 처리한다. BRIN은 연속된 블록 범위마다 요약을 저장하고 물리적 순서와 상관이 높은 컬럼에서 가장 효과적이다. 71.1은 BRIN이 손실(lossy) 인덱스여서 실행기가 재검사하고, 블록 범위 크기를 `pages_per_range`로 정한다고 한다. 11.3은 다중 컬럼을 지원하는 타입이 B-tree, GiST, GIN, BRIN뿐이라고 하고, 11.4는 정렬된 출력은 B-tree만 낼 수 있다고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 테이블에서 `created_at`의 물리적 상관(`pg_stats.correlation`)은 1이었고 B-tree 인덱스는 4,408 kB, BRIN은 24 kB였다. 하루치 범위 조회는 BRIN으로 Bitmap Heap Scan(`Heap Blocks: lossy=128`, `Rows Removed by Index Recheck: 16,688`, 0.598 ms)이 되었다. 무작위 값인 컬럼의 BRIN 인덱스는 플래너가 쓰지 않았다(Seq Scan). 10만 행 `text[]` 컬럼의 GIN은 `tags @> ARRAY['t42']`에 Bitmap Index Scan(200행, 0.177 ms)이었으나 같은 데이터의 `'t42' = ANY(tags)`와 jsonb의 `props->>'k' = '5'`는 GIN을 쓰지 못해 Seq Scan이었다(`props @> '{"k": 5}'`는 GIN 사용). Hash 인덱스는 `email = '...'`에서 쓰였고 범위 조건과 `ORDER BY email`에서는 쓰이지 않았으며(Seq Scan, Sort), 크기는 6,576 kB로 B-tree 7,960 kB보다 작았다. Hash로 다중 컬럼이나 UNIQUE 인덱스를 만들면 `does not support multicolumn indexes`, `does not support unique indexes` 오류였다. GiST는 직접 실행하지 않았다.
