---
slug: "dbl-13"
topic: "db-lock"
tier: DEEP
difficulty: 2
title: "동시에 같은 키를 INSERT할 때 ON CONFLICT는 어떻게 안전하게 동작하나요?"
keywords: ["ON CONFLICT DO UPDATE", "원자적 INSERT 또는 UPDATE", "유니크 충돌 시 대기", "조회 후 삽입 경쟁"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-insert.html", "https://www.postgresql.org/docs/16/transaction-iso.html"]
concepts: [race-condition, db-locking]
importance: 2
links: [{to: "dbl-16", kind: FOLLOWUP}, {to: "dbl-19", kind: FOLLOWUP}, {to: "misc-06", kind: RELATED}, {to: "misc-14", kind: RELATED}, {to: "dbs-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 INSERT ... ON CONFLICT DO UPDATE는 행마다 삽입되거나 갱신되는 둘 중 하나가 높은 동시성에서도 원자적으로 보장되는 upsert입니다. 먼저 SELECT로 있는지 확인하고 없으면 INSERT하는 방식은 두 트랜잭션이 동시에 없다고 판단해서 한쪽이 유니크 위반으로 실패할 수 있습니다. ON CONFLICT는 유니크 인덱스를 기준으로 충돌을 잡고, 충돌 원인이 다른 트랜잭션의 아직 끝나지 않은 삽입이면, 실험에서는 그 트랜잭션이 끝나기를 기다린 뒤 DO UPDATE는 갱신을, DO NOTHING은 건너뛰기를 했습니다. DO UPDATE에는 conflict_target이 필수이고, 갱신식에서는 기존 행을 테이블 이름으로, 넣으려던 값을 excluded로 참조합니다. 같은 문장 안에서 한 행을 두 번 갱신하게 되면 오류가 납니다.

```sql
INSERT INTO counters(name, hits) VALUES ('x', 1)
ON CONFLICT (name) DO UPDATE SET hits = counters.hits + 1;
```

(공식 문서) sql-insert의 ON CONFLICT 절: `DO UPDATE`는 원자적 INSERT 또는 UPDATE 결과를 보장한다(독립적 오류가 없다면). `DO UPDATE`에는 conflict_target이 필수이고 `DO NOTHING`은 생략 가능하다. 갱신식에서는 `excluded`로 넣으려던 값을 본다. 한 문장 안에서 같은 행을 두 번 이상 바꾸게 되면 cardinality violation 오류가 난다. transaction-iso 13.2.1절: READ COMMITTED에서 보이지 않는 다른 트랜잭션 때문에 충돌이 생긴 경우에도 `DO UPDATE`는 그 행을 갱신하고 `DO NOTHING`은 삽입하지 않을 수 있다.
(실험 확인) PostgreSQL 16.15, `name`이 기본 키인 테이블에서: (1) `SELECT count(*)`로 없음을 확인한 뒤 `INSERT`하는 두 세션을 겹치게 실행하자 둘 다 0을 읽었고 늦게 INSERT한 쪽이 `duplicate key value violates unique constraint`로 실패했다. (2) 한 세션이 `ON CONFLICT DO UPDATE`로 삽입하고 커밋하지 않은 동안 다른 세션의 같은 문장은 약 1.2초 기다린 뒤 `hits=2`를 돌려줬다. (3) `DO NOTHING`으로 바꾸면 기다린 뒤 0행을 반환했다.
(보충) MySQL 8.4의 `INSERT ... ON DUPLICATE KEY UPDATE`는 비슷한 용도의 문법으로, innodb-locks-set 문서에 따르면 중복 시 공유 락 대신 배타 락을 잡는다. PostgreSQL ON CONFLICT와 동작이 같다고 단정하지는 않는다.
