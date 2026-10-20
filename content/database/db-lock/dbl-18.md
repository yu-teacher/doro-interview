---
slug: "dbl-18"
topic: "db-lock"
tier: TRICKY
difficulty: 3
title: "READ COMMITTED에서 ORDER BY ... LIMIT과 FOR UPDATE를 같이 쓰면 왜 순서가 어긋날 수 있나요?"
keywords: ["정렬 후 락 획득", "대기 중 정렬 키 변경", "서브쿼리에 FOR UPDATE", "REPEATABLE READ는 직렬화 실패"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-select.html", "https://www.postgresql.org/docs/16/transaction-iso.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서 ORDER BY가 먼저 적용되고 그 뒤에 정렬된 순서대로 행을 잠급니다. READ COMMITTED에서 어떤 행이 다른 트랜잭션에게 잠겨 있으면 락이 풀릴 때까지 기다리는데, 그동안 그 트랜잭션이 정렬 컬럼 값을 바꿔 커밋하면 풀린 뒤 갱신된 행을 돌려주게 됩니다. 결과에 정렬 키가 이미 바뀐 행이 앞쪽에 섞여서 보기에는 순서가 어긋난 것처럼 보입니다. 우선순위 큐에서 가장 높은 우선순위 몇 건을 FOR UPDATE로 가져가려는 코드가 이런 상황의 예입니다. 서브쿼리 안에 FOR UPDATE를 넣으면 엄격한 순서를 얻지만 테이블의 모든 행을 잠그는 대가가 있고, REPEATABLE READ 이상에서는 이 경우 직렬화 오류가 납니다. SKIP LOCKED를 쓰면 잠긴 행을 건너뛰어 기다리지 않습니다.

```sql
-- 순서가 엄격해야 할 때(모든 행이 잠김):
SELECT * FROM (SELECT * FROM tasks FOR UPDATE) ss ORDER BY prio LIMIT 3;
```

(공식 문서) sql-select Locking Clause 절의 Caution: READ COMMITTED에서 ORDER BY와 잠금 절을 함께 쓰면 행이 순서에서 벗어나 반환될 수 있다. ORDER BY가 먼저 적용되고 잠금을 기다리다 풀린 뒤 정렬 컬럼 값이 바뀌어 있을 수 있기 때문이다. 해결책으로 서브쿼리에 FOR UPDATE를 두는 방법을 제시하지만, 그러면 테이블의 모든 행이 잠기므로 성능 차이가 클 수 있다고 한다. REPEATABLE READ나 SERIALIZABLE에서는 직렬화 실패(40001)가 나므로 순서가 어긋난 결과를 받을 가능성이 없다. `LIMIT`이 있으면 조건을 채울 만큼 행이 반환되면 잠금을 멈추지만 `OFFSET`으로 건너뛴 행도 잠긴다.
(실험 확인) PostgreSQL 16.15, `tasks`(id 1~4, prio 10, 20, 30, 40)에서 세션 A가 `id=1`의 prio를 99로 바꾸고 커밋하지 않은 동안, 세션 B가 `SELECT id, prio FROM tasks ORDER BY prio LIMIT 3 FOR UPDATE`를 실행했다. READ COMMITTED의 B는 A 커밋 뒤 `(1,99), (2,20), (3,30)`을 돌려줬다(prio가 99인 행이 맨 앞). REPEATABLE READ의 B는 `could not serialize access due to concurrent update` 오류였다. `FOR UPDATE SKIP LOCKED`의 B는 기다리지 않고 `(2,20), (3,30), (4,40)`을 즉시 받았다. 서브쿼리에 FOR UPDATE를 둔 위 형태(`SELECT * FROM (SELECT * FROM tasks FOR UPDATE) ss ORDER BY prio LIMIT 3`)의 B는 A 커밋을 기다린 뒤 `(2,20), (3,30), (4,40)`으로 올바른 순서였다.
