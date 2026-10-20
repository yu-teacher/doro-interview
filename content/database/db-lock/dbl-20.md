---
slug: "dbl-20"
topic: "db-lock"
tier: TRICKY
difficulty: 3
title: "값을 FOR SHARE로 읽고 나서 같은 행을 UPDATE하는 코드가 왜 데드락을 일으키나요?"
keywords: ["공유 락 동시 보유", "공유에서 배타로 승격 대기", "처음부터 FOR UPDATE", "원자적 UPDATE"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/errcodes-appendix.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html"]
---
**모범 답변 (30~60초)**
두 트랜잭션이 같은 행에 FOR SHARE를 걸면 공유 락끼리는 충돌하지 않아서 둘 다 성공합니다. 그런데 각자 그 행을 UPDATE하려면 배타 계열 락이 필요한데, 상대가 공유 락을 쥐고 있어서 서로 상대가 락을 풀기를 기다리는 순환이 되고 데드락이 납니다. PostgreSQL 16에서는 둘 중 하나가 40P01로 중단되고, MySQL 8.4 InnoDB 문서도 카운터 읽기 예시에서 같은 이유로 FOR SHARE가 좋은 해법이 아니라고 설명합니다. 읽고 나서 바꿀 값이면 처음부터 FOR UPDATE로 잡아서 두 번째 트랜잭션이 읽기 단계에서 기다리게 하거나, balance = balance + 1처럼 한 문장의 원자적 UPDATE로 바꾸는 편이 낫습니다.

(공식 문서) PostgreSQL explicit-locking 13.3.2절: FOR SHARE는 공유 락이라 다른 FOR SHARE나 FOR KEY SHARE와는 공존하지만 UPDATE, DELETE, FOR UPDATE, FOR NO KEY UPDATE는 막는다. 13.3.4절은 객체에 처음 잡는 락을 이후 필요한 가장 강한 모드로 하라고 권한다. errcodes-appendix: 40P01은 deadlock_detected다. MySQL 8.4 innodb-locking-reads: 카운터 예시에서 "두 사용자가 동시에 읽으면 적어도 한쪽은 카운터를 UPDATE하려다 데드락이 난다"며 FOR SHARE는 좋은 해법이 아니라고 하고, `SELECT ... FOR UPDATE` 후 UPDATE하거나 MySQL에서는 `LAST_INSERT_ID(counter_field + 1)`로 한 번의 접근으로 처리할 수 있다고 한다.
(실험 확인) PostgreSQL 16.15에서 두 세션이 `BEGIN; SELECT ... WHERE id=1 FOR SHARE; (0.8초 대기); UPDATE ... WHERE id=1; COMMIT;`을 실행하자 둘 다 SELECT에 성공했고, 한쪽이 `ERROR: deadlock detected`(40P01)로 중단됐다(최종 balance 100에서 110, 한 건만 반영). `FOR SHARE`를 `FOR UPDATE`로 바꾸면 데드락 없이 두 번째가 기다렸다가 둘 다 반영(120)됐다. MySQL 8.4.11에서도 같은 패턴이 `ERROR 1213 (40001)` 데드락이었다.
