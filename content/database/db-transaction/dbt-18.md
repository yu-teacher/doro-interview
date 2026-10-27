---
slug: "dbt-18"
topic: "db-transaction"
tier: TRICKY
difficulty: 2
title: "트랜잭션을 ROLLBACK하면 serial(시퀀스) 값도 되돌아가나요?"
keywords: ["시퀀스", "롤백되지 않습니다", "즉시 다른 모든 트랜잭션에 보이는", "id에 공백", "빈틈없이"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/sql-truncate.html", "https://www.postgresql.org/docs/16/functions-sequence.html"]
concepts: [acid, schema-design]
importance: 1
links: [{to: "dbt-01", kind: PREREQ}, {to: "dbd-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
아니요, PostgreSQL 16에서 시퀀스 변경은 롤백되지 않습니다. 시퀀스 값을 가져오는 것은 즉시 다른 모든 트랜잭션에 보이는 변경이라서, 값을 받은 트랜잭션이 롤백되어도 그 값은 되돌아오지 않고 그대로 소모됩니다. serial 컬럼의 카운터도 같습니다. 그래서 INSERT가 롤백되거나 실패하면 그 번호는 건너뛰어져 id에 공백이 생기고, 값이 빈틈없이 이어진다는 가정에 의존하면 안 됩니다. 시퀀스가 보장하는 것은 동시에 호출해도 서로 다른 값을 받는다는 점입니다.

```sql
INSERT INTO sq(v) VALUES (1);                         -- id 1
BEGIN; INSERT INTO sq(v) VALUES (2); INSERT INTO sq(v) VALUES (3); ROLLBACK;
INSERT INTO sq(v) VALUES (4);                         -- id 4 (2, 3은 소모됨)
```

(공식 문서) Transaction Isolation 절의 Important 박스는 시퀀스(따라서 serial 컬럼의 카운터)의 변경이 즉시 다른 모든 트랜잭션에 보이고 변경한 트랜잭션이 중단돼도 롤백되지 않는다고 밝힌다. 시퀀스 함수 문서는 `nextval`이 동시 호출에도 각 세션에 서로 다른 값을 주고, 호출한 트랜잭션이 나중에 중단돼도 그 값을 재사용하도록 회수하지 않아 중단이나 크래시로 값에 틈이 생길 수 있다고 한다. 반면 TRUNCATE 문서는 `RESTART IDENTITY`의 시퀀스 재시작이 트랜잭션으로 처리되어 롤백된다고 하지만 그 사이 시퀀스 연산이 있었다면 `currval()`은 실패한 트랜잭션의 마지막 값을 반영한다고 한다.
(실험 확인) PostgreSQL 16.15에서 위 SQL을 실행하자 테이블에는 (1, 1)과 (4, 4)만 있었다.
(보충) '빈틈없는 번호가 필요하면 시퀀스에 의존하지 말라'는 조언은 위 설명에서 이어지는 일반적인 실무 판단이며 문서가 별도로 권한 것은 아니다. MySQL의 AUTO_INCREMENT 동작은 읽지 않았다.
