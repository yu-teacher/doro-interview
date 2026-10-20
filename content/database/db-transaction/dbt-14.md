---
slug: "dbt-14"
topic: "db-transaction"
tier: DEEP
difficulty: 3
title: "2PC(two-phase commit)와 PostgreSQL의 PREPARE TRANSACTION은 무엇이고 애플리케이션에서 직접 써도 되나요?"
keywords: ["PREPARE TRANSACTION", "COMMIT PREPARED", "외부 트랜잭션 매니저", "max_prepared_transactions", "방치"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-prepare-transaction.html", "https://www.postgresql.org/docs/16/transaction-id.html", "https://www.postgresql.org/docs/16/sql-commit-prepared.html", "https://www.postgresql.org/docs/16/runtime-config-resource.html"]
concepts: [distributed-consistency]
importance: 2
links: [{to: "dst-09", kind: RELATED}, {to: "dst-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
2PC는 여러 데이터베이스나 자원에 걸친 트랜잭션을 원자적으로 커밋하려고 외부 트랜잭션 매니저가 쓰는 방식입니다. PostgreSQL 16의 PREPARE TRANSACTION은 현재 트랜잭션의 상태를 디스크에 완전히 저장하고 세션에서 분리해, 장애가 나도 높은 확률로 커밋할 수 있게 해 둡니다. 이후 COMMIT PREPARED나 ROLLBACK PREPARED를 다른 세션에서도 실행할 수 있습니다. 문서는 트랜잭션 매니저를 만드는 게 아니라면 쓰지 말라고 하는데, 준비된 트랜잭션이 방치되면 락을 계속 쥐고 VACUUM을 방해하며, 그래서 관리 체계가 없으면 `max_prepared_transactions`를 0으로 두라고 합니다.

(공식 문서) PREPARE TRANSACTION 문서는 준비된 트랜잭션이 세션에서 분리되어 상태가 디스크에 저장되고, 준비된 트랜잭션은 `pg_prepared_xacts` 뷰에 나오며, 명령이 실패하면 ROLLBACK이 된다고 한다. 임시 테이블을 쓴 트랜잭션, WITH HOLD 커서, LISTEN/NOTIFY를 쓴 트랜잭션은 준비할 수 없다. 이 명령이 PostgreSQL 확장이며 표준이 다루는 X/Open XA 같은 외부 트랜잭션 관리 시스템을 위한 것이고 SQL 쪽은 표준화되지 않았다고 한다. 서버 설정 문서는 `max_prepared_transactions`의 기본값이 0(기능 비활성)이고 서버 시작 시에만 설정할 수 있다고 한다. 오래 방치하면 VACUUM을 방해하고 극단적으로는 transaction ID wraparound 방지를 위해 데이터베이스가 종료될 수 있으며, 락도 계속 쥔다고 경고한다. Transactions and Identifiers 절은 준비된 트랜잭션이 GID(최대 200바이트 길이의 문자열)를 가진다고 하는데 PREPARE TRANSACTION 문서는 200바이트 미만이라고 적어 경계값은 단정하지 않는다.
(실험 확인) PostgreSQL 16.15의 `max_prepared_transactions` 기본값은 0이었고, `PREPARE TRANSACTION 'x1'`은 `ERROR: prepared transactions are disabled`로 실패하며 그 트랜잭션은 롤백됐다. 값을 올리려면 서버 재시작이 필요해 공용 실험 컨테이너를 바꾸지 않았으므로 PREPARE와 COMMIT PREPARED의 성공 동작은 실험하지 않았다. MySQL의 XA는 이번에 읽지 않았다.
