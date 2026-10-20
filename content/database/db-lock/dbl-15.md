---
slug: "dbl-15"
topic: "db-lock"
tier: DEEP
difficulty: 3
title: "MySQL InnoDB의 레코드 락, 갭 락, next-key 락은 무엇이고 PostgreSQL과 어떻게 다른가요?"
keywords: ["인덱스 레코드 락", "갭 락", "next-key 락", "REPEATABLE READ 범위 삽입 차단", "READ COMMITTED 갭 락 해제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-locks-set.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html", "https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-locks-table.html", "https://www.postgresql.org/docs/16/explicit-locking.html"]
---
**모범 답변 (30~60초)**
MySQL 8.4 InnoDB의 행 락은 사실 인덱스 레코드에 거는 락입니다. 레코드 락은 인덱스 레코드 하나를, 갭 락은 인덱스 레코드 사이의 빈 구간을 잠가서 그 구간에 다른 트랜잭션이 삽입하지 못하게 하고, next-key 락은 레코드 락과 그 앞쪽 갭 락의 조합입니다. 기본 격리 수준인 REPEATABLE READ에서는 범위 조건의 잠금 읽기와 UPDATE, DELETE가 next-key 락을 써서 범위 안의 삽입을 막아 팬텀을 방지하지만, 유니크 인덱스로 존재하는 한 행을 찾을 때는 레코드 락만 겁니다. READ COMMITTED로 바꾸면 갭 락은 외래 키와 중복 키 검사에만 쓰입니다. PostgreSQL 16의 행 락은 같은 행의 쓰기·잠금만 막고 갭 개념이 없어서, 같은 범위를 잠가도 새 행 삽입은 막히지 않았습니다(READ COMMITTED 실험).

(공식 문서) MySQL 8.4 innodb-locking: 갭 락은 "인덱스 레코드 사이의 갭" 또는 첫 레코드 앞·마지막 뒤의 갭 락이며 삽입을 막는 것이 유일한 목적이고 서로 공존한다. next-key 락은 레코드 락과 그 앞 갭 락의 조합이고 기본 격리 수준 REPEATABLE READ에서 검색과 인덱스 스캔에 사용된다. 유니크 인덱스로 단일 행을 찾는 문장은 갭 락이 필요 없다. READ COMMITTED에서는 검색·인덱스 스캔의 갭 락이 꺼진다. innodb-locks-set: 잠금 읽기·UPDATE·DELETE는 스캔한 모든 인덱스 레코드에 락을 건다(WHERE로 제외될 행도 해당). 적합한 인덱스가 없어 테이블 전체를 스캔하면 모든 행이 잠겨 다른 사용자의 삽입이 모두 막힌다. 보조 인덱스 검색에서 락이 배타적이면 클러스터 인덱스 레코드도 함께 잠근다. innodb-transaction-isolation-levels: READ COMMITTED는 갭 락 없이 인덱스 레코드만 잠그며, 이때 팬텀이 생길 수 있다. PostgreSQL explicit-locking 13.3.2절은 행 락이 같은 행의 쓰기·잠금 쪽만 막는다고 하며 갭 개념은 나오지 않는다.
(실험 확인) 같은 테이블(`id` 10, 20, 30)에서 `SELECT ... WHERE id BETWEEN 15 AND 25 FOR UPDATE`를 열어 두고 다른 세션이 `INSERT`를 시도한 결과다.

| 삽입할 id | MySQL 8.4 RR | MySQL 8.4 RC | PostgreSQL 16 RC |
|---|---|---|---|
| 5 | 통과 | 통과 | 통과 |
| 12 | 대기(1205) | 통과 | 통과 |
| 22 | 대기(1205) | 통과 | 통과 |
| 28 | 대기(1205) | 통과 | 통과 |
| 35 | 통과 | 통과 | 통과 |

`performance_schema.data_locks`는 MySQL RR에서 `PRIMARY` 인덱스의 `X`(id 20, next-key)와 `X,GAP`(id 30의 앞 갭), 테이블 `IX`를 보여 줬고, RC에서는 `X,REC_NOT_GAP`(id 20)만 보여 줬다. `data_locks` 문서의 `LOCK_MODE` 허용값 목록(`S[,GAP]`, `X[,GAP]` 등)에는 `REC_NOT_GAP`이 없지만 이 버전에서는 `X,REC_NOT_GAP`이 실제로 관찰됐다. PostgreSQL에서는 같은 범위의 20번 행 DELETE만 대기했다. 존재하지 않는 키의 잠금 읽기는 dbl-16에서 따로 다룬다.
