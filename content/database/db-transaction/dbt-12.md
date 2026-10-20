---
slug: "dbt-12"
topic: "db-transaction"
tier: DEEP
difficulty: 2
title: "PostgreSQL과 MySQL InnoDB는 MVCC를 어떻게 다르게 구현하고 기본 격리 수준은 어떻게 다른가요?"
keywords: ["READ COMMITTED", "REPEATABLE READ", "undo 로그", "dead tuple", "VACUUM", "purge"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/mvcc-intro.html", "https://www.postgresql.org/docs/16/routine-vacuuming.html", "https://www.postgresql.org/docs/16/transaction-iso.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html", "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html"]
---
**모범 답변 (30~60초)**
기본 격리 수준부터 다릅니다. PostgreSQL 16은 READ COMMITTED이고 MySQL 8.4(InnoDB)는 REPEATABLE READ입니다. 옛 버전 보관 방식도 다릅니다. PostgreSQL은 UPDATE마다 새 행 버전을 같은 테이블에 만들고 옛 버전은 dead tuple로 남겨 두었다가 VACUUM이 치웁니다. InnoDB는 클러스터형 인덱스의 행을 제자리에서 갱신하고 이전 내용은 undo 로그(롤백 세그먼트)에 두며, 어떤 스냅샷도 필요로 하지 않게 된 undo 로그를 purge가 폐기하면서 삭제된 행도 물리적으로 지웁니다. 두 DB 모두 오래 열린 트랜잭션이 정리를 막습니다.

| 항목 | PostgreSQL 16 | MySQL 8.4(InnoDB) |
|---|---|---|
| 기본 격리 수준 | READ COMMITTED | REPEATABLE READ |
| 옛 행 버전 위치 | 같은 테이블 안에 옛 행 버전이 남음 | undo 로그(롤백 세그먼트)에 변경 전 내용 |
| 정리 주체 | VACUUM / autovacuum | purge (undo 로그 폐기 시 삭제 행 물리 제거) |
| 오래 열린 트랜잭션의 영향 | 옛 버전을 VACUUM이 못 지움 | undo 로그를 폐기하지 못해 롤백 세그먼트가 커짐 |

(공식 문서) PostgreSQL: Routine Vacuuming 절은 옛 행 버전이 MVCC 때문에 남고 VACUUM이 제거한다고 하고, Transaction Isolation 절과 서버 설정 문서는 기본이 Read Committed라고 한다. MySQL: Multi-Versioning 절은 InnoDB가 변경된 행의 옛 정보를 undo 테이블스페이스의 롤백 세그먼트에 보관해 롤백과 일관 읽기에 쓰고, 행마다 트랜잭션 ID(`DB_TRX_ID`)와 undo 레코드를 가리키는 롤 포인터(`DB_ROLL_PTR`)를 두며 클러스터형 인덱스 레코드는 제자리 갱신이지만 보조 인덱스 레코드는 제자리 갱신이 아니라고 한다. 삭제는 삭제 표시일 뿐 undo 로그 폐기 시 purge가 물리적으로 지우고, 스냅샷을 필요로 하는 트랜잭션이 있으면 폐기할 수 없으므로 읽기만 하는 트랜잭션도 정기적으로 커밋하라고 권한다. 격리 수준 절은 InnoDB 기본이 REPEATABLE READ이고 일관 읽기가 첫 읽기의 스냅샷을 읽는다고 한다.
(실험 확인) MySQL 8.4.11에서 `START TRANSACTION WITH CONSISTENT SNAPSHOT`로 연 트랜잭션이 있는 동안 다른 세션이 UPDATE를 세 번 하고 절반을 DELETE해 커밋해도, 그 트랜잭션의 COUNT는 1000, 합계는 0으로 변경 전 값이었다. PostgreSQL 16.15에서는 REPEATABLE READ 트랜잭션이 열려 있는 동안 1000행을 DELETE하고 `VACUUM VERBOSE`를 하자 `1000 are dead but not yet removable`이었고, 그 트랜잭션이 끝난 뒤에는 1000개가 제거됐다.
