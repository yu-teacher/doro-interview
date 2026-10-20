---
slug: "dbt-15"
topic: "db-transaction"
tier: DEEP
difficulty: 2
title: "DDL은 트랜잭션 안에서 롤백되나요? PostgreSQL과 MySQL의 차이를 설명해 주세요."
keywords: ["DDL", "ROLLBACK하면 취소", "암묵적으로 커밋", "MVCC-safe", "TRUNCATE"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-truncate.html", "https://www.postgresql.org/docs/16/mvcc-caveats.html", "https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html"]
concepts: [tx-boundary]
importance: 1
links: [{to: "dbd-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서는 CREATE TABLE이나 ALTER TABLE 같은 DDL도 트랜잭션 안에서 실행되고 ROLLBACK하면 취소됩니다. 공식 문서가 명시한 것은 TRUNCATE로, 롤백되면 안전하게 되돌려진다고 하지만 MVCC-safe하지는 않아서 이전 스냅샷을 가진 트랜잭션에는 커밋 후 빈 테이블로 보일 수 있습니다. MySQL 8.4에서는 DDL 문이 진행 중인 트랜잭션을 먼저 암묵적으로 커밋하고, DDL 자체도 롤백할 수 없습니다. 그래서 MySQL에서 INSERT 뒤 CREATE TABLE을 하고 ROLLBACK해도 INSERT는 이미 커밋된 상태로 남습니다.

```sql
-- PostgreSQL 16: 둘 다 사라진다
BEGIN; CREATE TABLE ddl_t(id int); INSERT INTO ddl_t VALUES (1);
ALTER TABLE accounts ADD COLUMN note text; ROLLBACK;

-- MySQL 8.4: INSERT 행이 남고 ddl_t도 존재한다
START TRANSACTION; INSERT INTO ac VALUES (3); CREATE TABLE ddl_t(id int); ROLLBACK;
```

(공식 문서) TRUNCATE 문서는 테이블 데이터에 대해 트랜잭션 안전해서 둘러싼 트랜잭션이 커밋되지 않으면 안전하게 롤백되지만, MVCC-safe하지 않아 이전 스냅샷의 동시 트랜잭션에는 비어 보인다고 한다. Concurrency Control의 Caveats 절은 이 현상이 TRUNCATE와 테이블을 다시 쓰는 형태의 ALTER TABLE에만 해당한다고 한다. MySQL의 Implicit Commit 문서는 DDL이 현재 트랜잭션을 COMMIT한 것처럼 끝낸다고 하고, `CREATE/DROP TEMPORARY TABLE`은 커밋하지 않지만 롤백도 되지 않아 원자성이 깨진다고 한다.
(실험 확인) PostgreSQL 16.15에서 위 트랜잭션을 롤백하자 `ddl_t`와 `note` 컬럼이 모두 존재하지 않았다. MySQL 8.4.11에서는 롤백 뒤에도 INSERT한 행 3이 남았고 `ddl_t`가 존재했다. `CREATE TEMPORARY TABLE`을 쓴 경우에는 INSERT가 롤백됐지만 임시 테이블은 롤백 뒤에도 남아 있었다(문서의 설명과 같다).
(보충) 'PostgreSQL에서 CREATE TABLE·ALTER TABLE 같은 일반 DDL도 트랜잭션 안에서 롤백된다'는 문장은 참고한 문서가 직접 말한 것이 아니라 실험 결과(CREATE TABLE, ADD COLUMN)에 기댄 설명이다. 모든 DDL로 일반화하지 않았다.
