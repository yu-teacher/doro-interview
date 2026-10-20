---
slug: "dbl-05"
topic: "db-lock"
tier: BASIC
difficulty: 1
title: "데드락은 무엇이고, PostgreSQL과 MySQL InnoDB는 이를 어떻게 감지하나요?"
keywords: ["서로 상대 락을 대기", "deadlock_timeout 이후 검사", "한쪽 트랜잭션 중단", "InnoDB 기본 즉시 감지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/runtime-config-locks.html", "https://www.postgresql.org/docs/16/errcodes-appendix.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html"]
---
**모범 답변 (30~60초)**
둘 이상의 트랜잭션이 서로 상대가 쥔 락을 기다려서 영원히 진행하지 못하는 상태입니다. 트랜잭션 1이 행 A를, 2가 행 B를 잠근 뒤 서로 상대 행을 UPDATE하려 하면 생깁니다. PostgreSQL 16은 락을 기다리기 시작한 뒤 deadlock_timeout(기본 1초)이 지나면 데드락 검사를 하고, 데드락이면 관련 트랜잭션 하나를 40P01 오류로 중단시켜 나머지가 진행되게 합니다. 어느 쪽이 중단될지는 예측하면 안 됩니다. MySQL 8.4 InnoDB는 기본으로 데드락 감지가 켜져 있어 바로 감지하고, 변경 행 수가 작은 트랜잭션을 희생자로 고르려 합니다. 어느 쪽이든 오류를 받은 트랜잭션은 처음부터 다시 실행해야 합니다.

(공식 문서) PostgreSQL explicit-locking 13.3.4절: 데드락은 자동으로 감지되고 관련 트랜잭션 하나를 중단시켜 해결하며 어느 쪽이 중단될지는 예측하기 어렵다. 행 락만으로도(명시적 락을 쓰지 않아도) 생긴다. errcodes-appendix: 40P01은 deadlock_detected다. runtime-config-locks: `deadlock_timeout`은 데드락 검사를 하기 전에 락을 기다리는 시간이며 기본 1초, 검사가 비싸서 매번 하지 않는다. MySQL 8.4 innodb-deadlocks와 innodb-deadlock-detection: 감지가 켜져 있으면(기본, `innodb_deadlock_detect`) 트랜잭션을 롤백해 해결하고 변경 행 수가 작은 트랜잭션을 고르려 하며, 감지를 끄면 `innodb_lock_wait_timeout`으로 롤백된다. InnoDB가 알 수 없는 락(예: `LOCK TABLES`, 다른 엔진)은 감지하지 못한다.
(실험 확인) PostgreSQL 16.15: 두 세션이 서로 반대 순서로 두 행을 UPDATE하자 먼저 대기를 시작한 쪽이 약 1.0초 기다린 뒤 `ERROR: deadlock detected`(SQLSTATE 40P01, `Process A waits for ShareLock on transaction ...; blocked by process B`)를 받았고, 다른 쪽은 이어서 진행했다. MySQL 8.4.11(InnoDB): 같은 시나리오에서 순환을 완성한 쪽이 대기를 시작한 지 수 ms 안에(재실행 약 1.4ms) `ERROR 1213 (40001): Deadlock found when trying to get lock`을 받았다.

| | PostgreSQL 16 | MySQL 8.4 InnoDB |
|---|---|---|
| 감지 시점 | 대기 시작 후 `deadlock_timeout`(기본 1s) 뒤 | 기본 설정에서 즉시(이번 실험 수 ms) |
| 오류 | 40P01 | 1213 (40001) |
| 희생자 | 예측하지 말 것 | 변경 행 수가 작은 트랜잭션을 고르려 함 |

이 숫자는 이 컨테이너·이 시나리오에서 나온 값이며 환경에 따라 다를 수 있다.
