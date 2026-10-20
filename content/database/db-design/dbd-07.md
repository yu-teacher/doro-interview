---
slug: "dbd-07"
topic: "db-design"
tier: BASIC
difficulty: 2
title: "시퀀스(auto increment) 값에 빈 번호가 생기는 이유는 무엇이고, 빈 번호가 없는 채번이 필요하면 어떻게 하나요?"
keywords: ["nextval은 롤백되지 않음", "gap 허용", "동시성 때문", "MySQL AUTO_INCREMENT도 재사용 안 함", "카운터 행 락"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-createsequence.html", "https://www.postgresql.org/docs/16/functions-sequence.html", "https://www.postgresql.org/docs/16/datatype-numeric.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-auto-increment-handling.html"]
---
**모범 답변 (30~60초)**
시퀀스는 여러 트랜잭션이 동시에 번호를 받아야 해서, nextval이 한 번 번호를 내주면 트랜잭션이 롤백돼도 되돌리지 않습니다. 그래서 INSERT가 실패하거나 롤백되면 그 번호는 버려지고 컬럼에는 빈 번호가 생깁니다. serial이든 identity든 마찬가지이고, MySQL 8.4(InnoDB)의 AUTO_INCREMENT도 롤백된 값을 재사용하지 않습니다. 기본키처럼 gap이 있어도 되는 용도에는 문제가 없지만, 연속성이 필수인 번호는 시퀀스에 기대면 안 됩니다. 그런 경우에는 카운터 행을 락을 잡고 갱신해 채번하는 방법이 있는데, 시퀀스보다 동시성 비용이 훨씬 큽니다.

```sql
INSERT INTO s1(v) VALUES('a');                       -- id 1
BEGIN; INSERT INTO s1(v) VALUES('b'); ROLLBACK;      -- id 2 소모
INSERT INTO s1(v) VALUES('c');                       -- id 3
```

(공식 문서) PostgreSQL 16 sql-createsequence 페이지는 nextval과 setval은 롤백되지 않으므로 빈틈 없는 채번이 필요하면 시퀀스를 쓸 수 없고, 카운터를 담은 테이블에 배타 락을 거는 방법은 가능하지만 시퀀스보다 훨씬 비싸다고 한다. functions-sequence 페이지는 같은 시퀀스에서 번호를 받는 동시 트랜잭션을 막지 않으려고 nextval이 얻은 값을 트랜잭션이 중단돼도 회수하지 않으며, 그래서 중단이나 크래시로 gap이 생길 수 있다고 한다. datatype-numeric 페이지는 serial 계열이 시퀀스로 구현되어 행이 지워지지 않아도 빈 번호가 생길 수 있고, 삽입 트랜잭션이 롤백되는 경우가 한 예라고 한다. MySQL 8.4 innodb-auto-increment-handling 페이지는 모든 락 모드에서 롤백된 트랜잭션이 만든 auto-increment 값은 사라지고 재사용되지 않아 gap이 생길 수 있다고 한다.
(실험 확인) PostgreSQL 16.15에서 identity 컬럼에 `a`를 넣고, 트랜잭션 안에서 `b`를 넣었다가 롤백한 뒤 `c`를 넣자 id는 1, 3이었다. `nextval('sq')`를 트랜잭션 안에서 부르고 롤백한 뒤 다시 부르면 1 다음 2가 나왔다(롤백되지 않음). 데이터를 `id = 1, 2`로 직접 넣은 뒤 `serial` 컬럼의 DEFAULT를 쓰면 시퀀스가 아직 1이라 기본키 중복 오류가 났다. MySQL 8.4.11(InnoDB)에서도 같은 순서로 `a`, 롤백한 `b`, `c`를 넣으면 id는 1, 3이었다.
(보충) 번호가 연속이어야 하는 법적·업무 요구가 있을 때 카운터 행을 갱신하는 설계는 일반적인 방법이며, 락 대기로 처리량이 떨어지는 정도는 환경에 따라 다르다.
