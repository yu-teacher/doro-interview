---
slug: "dbl-10"
topic: "db-lock"
tier: DEEP
difficulty: 2
title: "SELECT FOR UPDATE SKIP LOCKED로 작업 큐를 만드는 방법과 주의점은 무엇인가요?"
keywords: ["FOR UPDATE SKIP LOCKED", "잠긴 행 건너뜀", "여러 소비자 경합 제거", "일관성 없는 뷰"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-select.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html"]
concepts: [db-locking, messaging]
importance: 2
links: [{to: "dbl-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
여러 워커가 같은 테이블의 대기 작업을 가져갈 때, SELECT ... FOR UPDATE SKIP LOCKED는 다른 워커가 이미 잠근 행을 기다리지 않고 건너뛰고 나머지 행만 잠가서 돌려줍니다. 그래서 워커들이 서로 락을 기다리지 않고 서로 다른 작업을 가져갑니다. 보통 CTE에서 LIMIT n으로 뽑은 id를 UPDATE로 running 같은 상태로 바꾸고 RETURNING으로 받아 갑니다. 다만 잠긴 행을 건너뛰기 때문에 일반 조회에는 맞지 않는 일관성 없는 뷰이고 큐처럼 한 행만 맡으면 되는 용도에만 씁니다. 행 락을 잡는 것은 디스크 쓰기를 동반할 수 있고, NOWAIT나 SKIP LOCKED도 테이블 락은 보통대로 기다립니다. MySQL 8.4 InnoDB도 같은 문법을 지원합니다.

```sql
WITH picked AS (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY id LIMIT 2 FOR UPDATE SKIP LOCKED
)
UPDATE jobs j SET status = 'running', worker = 'w1'
FROM picked WHERE j.id = picked.id
RETURNING j.id;
```

(공식 문서) PostgreSQL sql-select의 Locking Clause 절: `SKIP LOCKED`는 즉시 잠글 수 없는 행을 건너뛰며, 데이터의 일관성 없는 뷰를 주므로 범용 용도로는 부적합하지만 큐 형태 테이블에서 여러 소비자의 경합을 피하는 데 쓸 수 있다. `LIMIT`이 있으면 조건을 채울 만큼 행이 반환되면 잠그는 것을 멈춘다. MySQL 8.4 innodb-locking-reads도 `SKIP LOCKED`가 잠긴 행을 결과에서 빼며 같은 이유로 일반 용도에는 적합하지 않고 큐 형태 테이블에 쓸 수 있다고 쓴다.
(실험 확인) PostgreSQL 16.15에서 `pending` 작업 6개를 두고 워커 3개가 거의 동시에 위 쿼리(LIMIT 2)를 실행하자 각각 (1,2), (3,4), (5,6)을 서로 겹치지 않게 즉시 받았다. 같은 구조에서 `SKIP LOCKED` 없이 `FOR UPDATE`만 쓴 두 번째 워커는 첫 워커의 트랜잭션이 끝나길 기다렸다(재실행에서 약 1.9초, 그 뒤 `(3,4)`를 가져감). MySQL 8.4.11에서는 한 세션이 1번 행을 잠근 상태에서 `SELECT * FROM accounts FOR UPDATE SKIP LOCKED`가 나머지 2, 3번 행을 즉시 돌려줬다.
(보충) CTE로 id를 뽑아 `UPDATE ... RETURNING`으로 가져가는 형태는 공식 문서의 예시가 아니라 흔히 쓰이는 큐 구현 관용구다. 위 실험은 이 쿼리가 이 데이터에서 겹치지 않게 나왔다는 것만 보여 준다.
