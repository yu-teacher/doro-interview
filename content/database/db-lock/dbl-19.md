---
slug: "dbl-19"
topic: "db-lock"
tier: TRICKY
difficulty: 3
title: "같은 키를 여러 세션이 동시에 INSERT하다가 먼저 간 세션이 롤백되면 MySQL InnoDB에서는 왜 데드락이 날 수 있나요?"
keywords: ["중복 키 시 공유 락 요청", "배타 락 승격 교착", "롤백 시 대기자 동시 승인", "PostgreSQL은 순서대로 대기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://dev.mysql.com/doc/refman/8.4/en/innodb-locks-set.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html"]
concepts: [deadlock, db-locking]
importance: 1
links: [{to: "dbl-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
MySQL 8.4 InnoDB에서 INSERT가 중복 키 오류를 만나면 그 중복 레코드에 공유 락을 요청합니다. 세션 1이 키 1을 INSERT해 배타 락을 쥐고 있고 세션 2와 3도 같은 키를 INSERT하면, 둘 다 중복 키 오류를 겪고 공유 락을 요청하며 대기합니다. 세션 1이 롤백하면 대기 중이던 두 공유 락이 함께 승인되고, 이제 각자 INSERT를 위해 배타 락이 필요한데 상대의 공유 락 때문에 얻지 못해서 서로 기다리는 데드락이 됩니다. 한쪽이 희생되어 1213 오류를 받으니 재시도해야 합니다. 같은 순서를 PostgreSQL 16에서 실행하면 데드락 없이 차례로 진행했습니다. ON DUPLICATE KEY UPDATE는 배타 락을 걸지만 이번 실험에서는 그 문장도 데드락이 났습니다.

(공식 문서) MySQL 8.4 innodb-locks-set 문서는 중복 키 오류가 나면 중복 인덱스 레코드에 공유 락을 걸고, 여러 세션이 같은 행을 INSERT하는데 다른 세션이 배타 락을 갖고 있으면(예: 그 행을 지우는 세션) 데드락이 날 수 있다고 한다. 세션 1 INSERT 후 세션 2, 3이 INSERT하고 세션 1이 롤백하는 순서, 그리고 기존 행을 세션 1이 DELETE한 뒤 커밋하는 변형 둘 다 세션 2와 3이 데드락에 빠진다고 설명한다. 같은 문서는 `INSERT ... ON DUPLICATE KEY UPDATE`가 중복 시 공유 락 대신 배타 락을 건다고 하지만, 그것이 이 데드락을 막는다고는 말하지 않는다. innodb-deadlocks-handling은 데드락 시 재시도를 권한다.
(실험 확인) MySQL 8.4.11(InnoDB), 빈 테이블 `t1(i INT PRIMARY KEY)`에서 세션 1이 `INSERT 1` 후 1.5초 뒤 `ROLLBACK`, 세션 2와 3이 각각 0.3초, 0.6초 뒤 `INSERT 1`을 했다. 세션 1이 롤백한 직후 세션 3이 `ERROR 1213 (40001): Deadlock found when trying to get lock`을 받았고 세션 2는 INSERT에 성공했다(최종 행 1개). 기존 행을 세션 1이 DELETE한 뒤 커밋하는 변형도 세션 3이 1213을 받았다. 세션 2와 3이 `INSERT ... ON DUPLICATE KEY UPDATE i=i`를 해도 같은 순서에서 3번 모두 세션 3이 1213을 받았고, `SHOW ENGINE INNODB STATUS`에는 두 트랜잭션이 `lock_mode X`를 쥐고 `insert intention waiting` 중인 데드락으로 나왔다. 문서가 이 경우를 설명하지는 않는다. 같은 순서를 PostgreSQL 16.15에서 실행하면 데드락 없이 세션 2가 INSERT에 성공하고 세션 3은 세션 2의 커밋 뒤 `duplicate key value violates unique constraint` 오류를 받았다.
