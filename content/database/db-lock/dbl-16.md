---
slug: "dbl-16"
topic: "db-lock"
tier: TRICKY
difficulty: 3
title: "존재하지 않는 행에 SELECT FOR UPDATE를 걸면 동시 INSERT를 막을 수 있나요? PostgreSQL과 InnoDB를 비교해 주세요."
keywords: ["없는 행은 잠글 수 없음", "InnoDB 갭 락", "유니크 제약이 최종 방어", "ON CONFLICT 또는 어드바이저리 락"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/sql-insert.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-locks-set.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html"]
concepts: [db-locking, race-condition]
importance: 1
links: [{to: "dbl-02", kind: PREREQ}, {to: "dbl-13", kind: PREREQ}, {to: "misc-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서는 막을 수 없습니다. 행 락은 SELECT가 가져온 행에 걸리므로, 없는 id에 FOR UPDATE를 걸면 0행이 나오고 아무것도 잠기지 않아서 다른 세션이 그 id를 INSERT해 커밋할 수 있습니다. 그러면 처음 세션이 이어서 INSERT할 때 유니크 위반으로 실패합니다. 이런 경쟁은 유니크 제약을 최종 방어선으로 두고 ON CONFLICT로 처리하거나, 키에 어드바이저리 락을 거는 식으로 풉니다. MySQL 8.4 InnoDB의 REPEATABLE READ에서는 이번 실험에서 없는 키의 잠금 읽기가 그 키가 속한 갭에 락을 걸어 같은 갭에 삽입하려는 세션이 기다렸습니다. 하지만 READ COMMITTED에서는 갭 락이 꺼져 막지 못하므로 같은 코드가 격리 수준에 따라 다르게 동작합니다.

(공식 문서) PostgreSQL explicit-locking 13.3.2절은 FOR UPDATE가 SELECT가 가져온 행을 잠근다고 설명하며, 행 락은 같은 행의 쓰기·잠금만 막는다고 한다. 존재하지 않는 행을 잠그는 방법은 설명하지 않는다. sql-insert의 ON CONFLICT 절은 동시 삽입에서 원자적 INSERT 또는 UPDATE를 보장한다. MySQL 8.4 innodb-locking: 갭 락은 인덱스 레코드 사이 빈 구간의 삽입을 막고, `SELECT ... FOR UPDATE`로 범위의 갭을 잠글 수 있으며 READ COMMITTED에서는 갭 락이 꺼진다. 같은 문서는 유니크 인덱스로 유일한 행을 찾는 문장에는 갭 락이 필요 없다고 하지만, 존재하지 않는 키를 찾는 경우는 설명하지 않는다.
(실험 확인) 테이블에 id 10, 20, 30이 있고 id 25는 없다. 세션 A가 `BEGIN; SELECT * FROM t WHERE id=25 FOR UPDATE;`(0행) 뒤 1.5초 있다가 `INSERT id=25`를 하고, 세션 B가 0.4초 뒤 `INSERT id=25`를 했다.

| DB / 격리 수준 | B의 INSERT | A의 INSERT |
|---|---|---|
| PostgreSQL 16.15, READ COMMITTED | 수 ms 안에 즉시 성공 | `duplicate key value violates unique constraint` 오류 |
| MySQL 8.4.11, REPEATABLE READ | A가 커밋할 때까지 약 1.1초 대기 후 `Duplicate entry '25'` 오류 | 성공 |
| MySQL 8.4.11, READ COMMITTED | 수 ms 안에 즉시 성공 | `Duplicate entry '25'` 오류 |

MySQL REPEATABLE READ에서 A가 `id=25`를 FOR UPDATE로 읽은 직후 `performance_schema.data_locks`에는 `PRIMARY` 인덱스의 `X,GAP`(id 30 앞 갭)과 테이블 `IX`가 보였다. 이 결과는 이 테이블(기본 키 id)과 이 시나리오에서 나온 값이다.
(보충) 없는 키 하나의 잠금 읽기가 REPEATABLE READ에서 갭을 잠근다는 설명은 참고한 세 페이지에 직접 없고, 범위 조건 예제와 Phantom Rows 페이지(next-key 락으로 없는 행의 존재를 잠금)에서 간접적으로 뒷받침되며 위 실험과 `data_locks` 관찰로 확인했다. 유니크 제약을 최종 방어선으로 두고 ON CONFLICT나 어드바이저리 락으로 푼다는 해법은 관련 문서 설명에서 이끌어 낸 일반적인 접근이며, 문서가 이 문제에 권한 것은 아니다.
