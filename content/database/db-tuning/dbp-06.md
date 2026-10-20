---
slug: "dbp-06"
topic: "db-tuning"
tier: BASIC
difficulty: 2
title: "OFFSET 페이징은 뒤쪽 페이지로 갈수록 왜 느려지고, 키셋 페이징은 무엇인가요?"
keywords: ["건너뛴 행도 계산", "마지막 행의 정렬 키", "인덱스 범위 탐색", "유일한 정렬 키", "페이지 점프 불가"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/queries-limit.html", "https://www.postgresql.org/docs/16/functions-comparisons.html", "https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html", "https://dev.mysql.com/doc/refman/8.4/en/row-constructor-optimization.html"]
---
**모범 답변 (30~60초)**
OFFSET n은 앞의 n행을 건너뛰어야 하는데, 건너뛰는 행도 서버 안에서는 일단 계산해야 해서 페이지가 뒤로 갈수록 읽는 행이 늘고 느려집니다. 키셋 페이징은 마지막으로 본 행의 정렬 키를 기억했다가, WHERE (created_at, id) < (마지막 값) ORDER BY created_at DESC, id DESC LIMIT 20처럼 그 다음 행부터 인덱스로 바로 찾는 방식이라 페이지 깊이와 상관없이 비용이 거의 일정합니다. 대신 임의 페이지로 바로 점프하기 어렵고, 정렬 키가 유일해야 합니다. MySQL 8.4(InnoDB)에서는 이 행 생성자 비교가 인덱스 범위로 쓰이지 않았고, OR 조건으로 풀어 쓰자 인덱스 범위 스캔이 되었습니다.

```sql
-- PostgreSQL 16: 인덱스 (created_at DESC, id DESC)
SELECT id, created_at FROM orders
WHERE (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC LIMIT 20;

-- MySQL 8.4: 행 생성자 대신 풀어 쓴 조건
WHERE created_at < :c OR (created_at = :c AND id < :i)
```

(공식 문서) PostgreSQL LIMIT and OFFSET 절은 OFFSET으로 건너뛴 행도 서버 안에서 계산해야 하므로 큰 OFFSET은 비효율적일 수 있고, LIMIT을 쓸 때는 ORDER BY로 순서를 고정해야 한다고 한다. PostgreSQL Row Constructor Comparison 절은 행 생성자의 `<`, `>` 비교가 왼쪽 원소부터 차례로 비교하다가 같지 않은 쌍에서 결과를 정한다고 한다(키셋 조건의 의미). MySQL LIMIT Query Optimization 절은 LIMIT과 ORDER BY를 같이 쓸 때 정렬을 인덱스로 처리하면 매우 빠르고, filesort가 필요하면 조건에 맞는 모든 행을 선택해 대부분 정렬한 뒤에야 처음 row_count개를 찾는다고 한다. Row Constructor Expression Optimization 절은 행 생성자 컬럼이 인덱스 접두부를 덮지 않으면 인덱스를 덜 쓰고, 행 생성자를 `c2 > 1 OR (c2 = 1 AND c3 > 1)` 같은 동등한 식으로 풀어 쓰면 인덱스를 더 쓴다고 보여 준다. 문서의 예는 접두부를 덮지 않는 경우이고, 우리 쿼리는 접두부를 덮는데도 아래 실험에서는 범위로 쓰이지 않았다(이 버전·데이터에서의 결과).
(실험 확인) PostgreSQL 16.15, 50만 행 orders. `ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 0`은 0.07~0.12ms, `OFFSET 400000`은 65~90ms(Index Scan이 40만 21행 읽음)였다. (created_at DESC, id DESC) 인덱스를 만든 뒤에도 OFFSET 400000은 30~35ms(Index Only Scan이 40만 20행)였고, 키셋 조건으로 바꾸자 0.04~0.09ms(Heap Fetches 0)였으며 결과 행은 OFFSET 쿼리와 같았다(두 번 실행한 범위). MySQL 8.4.11에서는 OFFSET 400000이 41~46ms(Covering index scan 40만 20행), `(created_at, id) < (...)` 행 생성자 조건은 인덱스를 40만 21행 훑고 필터링해 49~64ms, OR로 풀어 쓴 조건은 index range scan으로 0.25~0.27ms였다.
(보충) 키셋 페이징이 임의 페이지 점프를 지원하지 못하고 정렬 키가 유일해야 한다는 제약은 방식의 원리에서 오는 일반적 설명이며 위 문서가 직접 서술한 것은 아니다.
