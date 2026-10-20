---
slug: "dbt-07"
topic: "db-transaction"
tier: BASIC
difficulty: 2
title: "READ ONLY 트랜잭션은 무엇이고 어떤 경우에 쓰나요?"
keywords: ["READ ONLY", "BEGIN READ ONLY", "에러로 거부", "직렬화 충돌", "SERIALIZABLE READ ONLY DEFERRABLE"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-set-transaction.html", "https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/runtime-config-client.html"]
concepts: [tx-boundary]
importance: 1
links: [{to: "tx-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
READ ONLY 트랜잭션은 `BEGIN READ ONLY`나 `SET TRANSACTION READ ONLY`로 여는, 임시 테이블이 아닌 테이블에 쓰지 못하게 하는 트랜잭션입니다. PostgreSQL 16에서 INSERT, UPDATE, DELETE와 CREATE, ALTER, DROP 같은 문장은 에러로 거부되어 조회 전용 코드가 실수로 데이터를 바꾸는 것을 막습니다. 성능 면에서도 쓸모가 있어서, REPEATABLE READ의 읽기 전용 트랜잭션은 직렬화 충돌로 재시도할 일이 없고, SERIALIZABLE에서는 READ ONLY로 선언하면 감시 비용을 줄일 수 있습니다. 긴 보고서나 백업에는 SERIALIZABLE READ ONLY DEFERRABLE을 씁니다.

(공식 문서) `SET TRANSACTION` 문서는 읽기 전용 트랜잭션에서 비임시 테이블에 대한 INSERT, UPDATE, DELETE, MERGE, COPY FROM, 모든 CREATE·ALTER·DROP 등이 금지되며, 이것은 디스크 쓰기를 모두 막지는 않는 고수준의 읽기 전용 개념이라고 한다. DEFERRABLE은 SERIALIZABLE이면서 READ ONLY일 때만 효과가 있고, 처음 스냅샷을 얻을 때 블록될 수 있지만 그 뒤에는 직렬화 오버헤드도 실패 위험도 없이 실행되어 오래 걸리는 보고서나 백업에 알맞다고 한다. Transaction Isolation 절은 REPEATABLE READ에서 읽기 전용 트랜잭션은 직렬화 충돌이 절대 없고, SERIALIZABLE 성능을 위해 가능하면 READ ONLY로 선언하라고 권한다. 서버 설정 문서는 `default_transaction_read_only` 기본값이 off라고 한다.
(실험 확인) PostgreSQL 16.15의 `BEGIN READ ONLY` 안에서 SELECT는 됐고, INSERT는 `cannot execute INSERT in a read-only transaction`, `CREATE TEMP TABLE`은 `cannot execute CREATE TABLE in a read-only transaction`으로 거부됐다. `default_transaction_read_only`는 off였다. DEFERRABLE의 대기 동작은 실험하지 않았다.
