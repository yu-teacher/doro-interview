---
slug: "dbi-08"
topic: "db-index"
tier: DEEP
difficulty: 2
title: "커버링 인덱스와 INCLUDE 절은 무엇이고 일반 복합 인덱스와 어떻게 다른가요?"
keywords: ["Index Only Scan", "INCLUDE 비키 컬럼", "검색 키와 페이로드 분리", "유니크는 키 컬럼에만 적용", "넓은 컬럼은 인덱스 비대화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-index-only-scans.html", "https://www.postgresql.org/docs/16/indexes-unique.html", "https://www.postgresql.org/docs/16/indexes-multicolumn.html"]
---
**모범 답변 (30~60초)**
커버링 인덱스는 쿼리에 필요한 컬럼을 인덱스에 모두 담아서 테이블 힙을 읽지 않고 Index Only Scan으로 답하게 만든 인덱스입니다. PostgreSQL 16에서는 INCLUDE 절로 검색 키가 아닌 페이로드 컬럼을 붙일 수 있어서, (x) INCLUDE (y) 인덱스는 WHERE x = ? 로 찾고 y를 돌려주는 쿼리를 힙 접근 없이 처리합니다. INCLUDE 컬럼은 검색에 쓰이지 않으므로 인덱스가 다루지 못하는 데이터 타입이어도 되고, 유니크 인덱스라면 유일성은 키 컬럼 x에만 적용됩니다. 반면 y를 키에 넣은 (x, y) 인덱스는 y에 대한 조건과 정렬도 지원하지만 유니크가 조합 전체에 적용됩니다. 넓은 컬럼을 많이 넣으면 인덱스가 커지므로 조심해야 합니다.

```sql
CREATE INDEX ord2_user_inc ON ord2 (user_id) INCLUDE (amount);
SELECT amount FROM ord2 WHERE user_id = 777;   -- Index Only Scan 후보
```

(공식 문서) 11.9는 INCLUDE 절로 검색 키가 아닌 페이로드 컬럼을 붙이면 `SELECT y FROM tab WHERE x = 'key'`를 index-only scan으로 처리할 수 있다고 한다. INCLUDE 컬럼은 인덱스 기계가 해석하지 않으므로 인덱스가 다룰 수 없는 타입이어도 되고, 유니크 인덱스에서는 유일성 조건이 키 컬럼에만 적용된다고 한다. 페이로드 컬럼은 힙의 데이터를 중복 저장해 인덱스를 키우고 오히려 검색을 느리게 할 수 있으며, 키 크기가 인덱스 타입 최대치를 넘으면 삽입이 실패하고, 테이블이 천천히 바뀌어야 의미가 있다고 한다. INCLUDE는 B-tree, GiST, SP-GiST에서만 지원되고 표현식은 포함 컬럼이 될 수 없다고 한다. INCLUDE 이전에는 `(x, y)`처럼 뒤쪽 키 컬럼으로 같은 효과를 냈지만 키 컬럼에 대한 유일성 강제가 안 된다고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `ord2` 테이블에서 `(user_id) INCLUDE (amount)` 인덱스를 만들고 VACUUM한 뒤 `SELECT amount WHERE user_id = 777`은 `Index Only Scan`, `Heap Fetches: 0`(버퍼 4개 접근)이었다. 인덱스에 없는 `status`를 고르면 Bitmap Heap Scan으로 돌아갔고, INCLUDE 컬럼 `amount`로 찾는 `WHERE amount = 500`은 Seq Scan이어서 검색에는 쓰이지 않았다. `UNIQUE (x) INCLUDE (y)` 인덱스에 `(1,1)` 뒤 `(1,2)`를 넣으니 `Key (x)=(1) already exists`로 거부됐다. 인덱스 크기는 이 데이터에서 `INCLUDE` 쪽 4,784 kB, `(user_id, amount)` 쪽 4,408 kB였고 이유는 확인하지 않았다.
