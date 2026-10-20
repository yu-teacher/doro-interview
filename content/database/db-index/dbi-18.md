---
slug: "dbi-18"
topic: "db-index"
tier: TRICKY
difficulty: 3
title: "(a, b) 복합 인덱스가 있을 때 b 조건만으로 조회하면 인덱스를 타나요? PostgreSQL과 MySQL은 다른가요?"
keywords: ["선두 컬럼 조건 없음", "인덱스 전체 스캔", "MySQL 최좌측 접두", "MySQL Skip Scan", "b용 별도 인덱스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/indexes-multicolumn.html", "https://www.postgresql.org/docs/18/release-18.html", "https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html", "https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html"]
concepts: [index-design]
importance: 3
links: [{to: "dbi-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 문서에 따르면 다중 컬럼 B-tree 인덱스는 컬럼 일부만 조건에 써도 쓸 수 있지만, 선두 컬럼 조건이 없으면 인덱스 전체를 훑어야 해서 대부분은 플래너가 순차 스캔을 택합니다. 즉 가능은 해도 효율이 없습니다. (PostgreSQL 18 릴리스 노트에는 B-tree skip scan이 새 기능으로 올라 있어 이 설명은 16 기준입니다.) MySQL 8.4 문서는 조건 컬럼이 인덱스의 왼쪽 접두부가 아니면 조회에 인덱스를 못 쓴다고 설명하지만, 쿼리가 인덱스에 있는 컬럼만 쓰고 조건이 맞으면 Skip Scan 범위 접근으로 선두 컬럼의 고유값마다 건너뛰며 훑는 예외가 있습니다. 두 DB 모두 b로 자주 조회한다면 b를 선두에 둔 별도 인덱스를 만드는 것이 정석입니다.

(공식 문서) PostgreSQL 11.3은 다중 컬럼 B-tree 인덱스가 b·c에만 조건이 있어도 원칙적으로 쓸 수 있지만 인덱스 전체를 스캔해야 하므로 대부분 플래너가 순차 스캔을 선호한다고 한다. 16 문서 기준이며, 릴리스 노트 18은 "Allow skip scans of btree indexes"를 새 기능으로 적어 앞쪽 컬럼에 제약이 없는 경우에도 다중 컬럼 B-tree를 더 쓸 수 있게 되었다고 한다(이 문서의 실험은 16에서만 했다). MySQL 8.4의 Multiple-Column Indexes는 최좌측 접두부만 조회에 쓰이고 `(col1, col2, col3)` 인덱스에서 `col2` 단독 조건은 인덱스로 조회하지 않는다고 한다. 범위 최적화 문서의 Skip Scan 절은 쿼리가 한 테이블의 인덱스 컬럼만 참조하고 나머지 키 파트에 범위 조건이 있는 등의 조건에서 선두 키 파트의 고유값 사이를 건너뛰며 하위 범위를 스캔하고, `EXPLAIN`의 `Using index for skip scan`으로 표시되며 `optimizer_switch`의 `skip_scan`(기본 on)으로 제어한다고 한다.
(실험 확인) PostgreSQL 16.15, 행 20만 개 `orders`에서 `(user_id, created_at)` 인덱스만 있을 때 `created_at` 두 시간 범위(60행) 조회는 이 인덱스로 Index Scan을 했지만 버퍼를 785개 접근했다(4.870 ms). `(created_at, user_id)` 인덱스가 있을 때는 같은 쿼리가 버퍼 5개, 0.023 ms였다. 순차 스캔을 끄고 `created_at = '2026-06-01 00:00'`을 조회해도 `(user_id, created_at)`로 버퍼 770개를 읽었다. MySQL 8.4.11에서 `(user_id, created_at)` 인덱스만 둔 테이블에 `created_at` 범위로 `SELECT *`를 하면 `type: ALL`, `SELECT id, user_id, created_at`처럼 인덱스 컬럼만 고르면 `Using index for skip scan`으로 `idx_ab`를 사용했다(예상 22,190행).
