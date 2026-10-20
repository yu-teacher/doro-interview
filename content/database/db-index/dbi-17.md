---
slug: "dbi-17"
topic: "db-index"
tier: TRICKY
difficulty: 3
title: "WHERE에 OR 조건이 있으면 인덱스를 못 쓰나요?"
keywords: ["하나의 인덱스 스캔은 AND 조건", "BitmapOr로 결합", "한쪽이라도 인덱스 불가면 Seq Scan", "정렬 순서 유실", "MySQL Index Merge"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-bitmap-scans.html", "https://www.postgresql.org/docs/16/indexes-multicolumn.html", "https://dev.mysql.com/doc/refman/8.4/en/index-merge-optimization.html", "https://dev.mysql.com/doc/refman/8.4/en/index-btree-hash.html"]
---
**모범 답변 (30~60초)**
항상 못 쓰는 것은 아닙니다. PostgreSQL 16에서 인덱스 스캔 하나는 AND로 묶인 조건만 쓸 수 있어서, (a, b) 인덱스 하나로 a = 5 OR b = 6을 바로 처리하지는 못합니다. 하지만 OR의 각 항에 쓸 수 있는 인덱스가 있으면 각각 스캔해서 만든 비트맵을 OR로 합치는 BitmapOr 계획이 가능합니다. 대신 OR의 한쪽 항이라도 인덱스를 못 쓰면 전체를 Seq Scan으로 읽어야 하고, 비트맵은 물리 순서라 인덱스 정렬 순서가 사라져서 ORDER BY에는 별도 정렬이 필요합니다. MySQL 8.4(InnoDB)에도 비슷한 Index Merge 최적화가 있습니다.

(공식 문서) PostgreSQL 11.5는 단일 인덱스 스캔은 AND로 연결된 조건만 쓸 수 있어 `(a, b)` 인덱스로 `WHERE a = 5 OR b = 6`을 직접 처리할 수 없지만, 여러 인덱스(같은 인덱스의 여러 번 사용 포함)를 스캔해 메모리 비트맵을 만들고 AND·OR로 합친 뒤 힙을 물리 순서로 방문하는 방식으로 처리할 수 있다고 한다. 비트맵은 물리 순서라 원래 인덱스의 순서가 사라져 `ORDER BY`에는 별도 정렬이 필요하고, 인덱스 스캔이 추가될 때마다 시간이 들어 플래너가 일부러 단순 인덱스 스캔을 고르기도 한다고 한다. MySQL 8.4 Index Merge 문서는 여러 range 스캔을 하나로 합치는 접근이며 `key1 = 10 OR key2 = 20` 같은 쿼리에 쓰일 수 있고 합집합·교집합 알고리즘이 있다고 한다. 반면 B-tree·Hash 비교 문서는 OR의 한쪽에 쓸 인덱스가 없으면(`WHERE index=1 OR A=10`) 인덱스를 쓰지 않는다고 예시한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `user_id`와 `amount`에 각각 인덱스가 있을 때 `user_id = 777 OR amount = 500`은 두 Bitmap Index Scan을 `BitmapOr`로 합쳤다. `memo` 컬럼 인덱스와의 OR도 같았다. 한쪽을 인덱스 없는 식으로 바꾼 `user_id = 777 OR (memo || 'x') = 'a'`는 Seq Scan이었다. `user_id = 777 OR amount = 500`에 `ORDER BY user_id`를 붙이면 BitmapOr 위에 Sort 노드가 생겼다. MySQL 8.4.11에서 `user_id`와 `email` 각각의 인덱스가 있을 때 `user_id = 777 OR email = 'User5@Example.com'`은 `type: index_merge`, `Using sort_union(idx_user_created,idx_email)`였다.
