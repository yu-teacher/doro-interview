---
slug: "dbt-19"
topic: "db-transaction"
tier: TRICKY
difficulty: 3
title: "MySQL InnoDB의 REPEATABLE READ에서는 phantom read가 없나요?"
keywords: ["일반 SELECT는", "스냅샷", "next-key 락과 gap 락", "최신 상태", "READ COMMITTED에서는 gap 락을 쓰지 않아"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html"]
concepts: [isolation-level, db-locking]
importance: 1
links: [{to: "dbt-02", kind: PREREQ}, {to: "dbt-12", kind: PREREQ}, {to: "dbl-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
MySQL 8.4(InnoDB)의 REPEATABLE READ에서 일반 SELECT는 첫 읽기가 만든 스냅샷을 읽으므로 다른 세션이 삽입한 행이 보이지 않습니다. 그리고 FOR UPDATE나 FOR SHARE 같은 잠금 읽기와 UPDATE, DELETE는 범위 조건이면 next-key 락과 gap 락으로 그 범위에 다른 세션이 끼어드는 삽입을 막아 phantom을 방지합니다. 다만 잠금 읽기는 스냅샷이 아니라 최신 상태를 읽어서, 한 트랜잭션에서 일반 SELECT와 잠금 문장을 섞으면 서로 다른 시점을 보게 됩니다. READ COMMITTED에서는 gap 락을 쓰지 않아 phantom이 생길 수 있습니다.

```sql
-- id가 90, 102인 child 테이블, MySQL 8.4(InnoDB) REPEATABLE READ
START TRANSACTION;
SELECT COUNT(*) FROM child WHERE id > 100;                  -- 1
-- 다른 세션: INSERT INTO child VALUES (101); 커밋
SELECT COUNT(*) FROM child WHERE id > 100;                  -- 여전히 1 (스냅샷)
SELECT COUNT(*) FROM child WHERE id > 100 FOR UPDATE;       -- 2 (최신 상태)
```

(공식 문서) 격리 수준 절은 REPEATABLE READ에서 고유 인덱스의 고유 조건이면 해당 레코드만, 그 외 조건이면 스캔한 범위에 gap 락이나 next-key 락을 걸어 삽입을 막고, 일반 SELECT와 잠금 문장을 섞으면 서로 다른 상태를 보므로 섞기를 권하지 않는다고 한다. READ COMMITTED에서는 gap 락이 외래 키 검사와 중복 키 검사에만 쓰이고 phantom이 생길 수 있다고 한다. Phantom Rows 절은 next-key 락이 인덱스 레코드 락에 그 앞 gap 락을 합친 것이라고 설명한다. PostgreSQL 16은 락이 아니라 스냅샷과 직렬화 실패로 이를 다룬다.
(실험 확인) MySQL 8.4.11에서 위 시나리오 결과가 주석과 같았다. 반대로 A가 `id > 100`을 먼저 `FOR UPDATE`로 잠그면 B의 `INSERT (101)`은 `innodb_lock_wait_timeout` 1초 뒤 `ERROR 1205 Lock wait timeout exceeded`로 실패했다. A를 READ COMMITTED로 바꾸면 B의 INSERT가 성공했고 A의 두 번째 잠금 읽기가 2건을 봤다.
