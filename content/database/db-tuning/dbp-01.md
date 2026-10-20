---
slug: "dbp-01"
topic: "db-tuning"
tier: BASIC
difficulty: 1
title: "EXPLAIN과 EXPLAIN ANALYZE는 무엇이 다른가요?"
keywords: ["실행 계획과 추정 비용", "실제 실행", "실제 시간과 실제 행 수", "BEGIN과 ROLLBACK으로 감싸기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-explain.html", "https://www.postgresql.org/docs/16/using-explain.html", "https://dev.mysql.com/doc/refman/8.4/en/explain.html", "https://www.postgresql.org/docs/current/sql-explain.html"]
concepts: [query-planner]
importance: 3
links: [{to: "dbp-02", kind: FOLLOWUP}, {to: "dbp-08", kind: FOLLOWUP}, {to: "dbi-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16 기준으로 EXPLAIN은 쿼리를 실행하지 않고 플래너가 고른 실행 계획과 비용 추정치만 보여 줍니다. EXPLAIN ANALYZE는 쿼리를 실제로 실행한 뒤 노드별 실제 소요 시간과 실제 행 수를 추정치 옆에 같이 보여 줘서, 플래너의 추정이 얼마나 맞았는지 확인할 수 있습니다. 대신 실제로 실행되기 때문에 INSERT, UPDATE, DELETE에 쓰면 데이터가 바뀌므로 BEGIN과 ROLLBACK으로 감싸야 하고, 시간 측정 자체의 오버헤드가 있으며 결과를 클라이언트로 보내는 시간은 빠집니다. MySQL 8.4(InnoDB)에서도 EXPLAIN ANALYZE는 문장을 실행하고 트리 형식으로 실제 시간과 행 수를 보여 줍니다.

```sql
BEGIN;
EXPLAIN (ANALYZE) UPDATE orders SET status = 'X' WHERE id < 100;
SELECT count(*) FROM orders WHERE status = 'X';  -- 99 (같은 트랜잭션 안에서는 바뀌어 보임)
ROLLBACK;
SELECT count(*) FROM orders WHERE status = 'X';  -- 0
```

(공식 문서) PostgreSQL 16 EXPLAIN 페이지는 ANALYZE 옵션을 주면 명령을 실제로 실행하고 SELECT 결과만 버릴 뿐 다른 부작용은 그대로 일어난다고 하며, 데이터를 바꾸지 않으려면 BEGIN; EXPLAIN ANALYZE ...; ROLLBACK; 형태를 쓰라고 한다. 같은 페이지의 Notes는 노드별 실행 시간 측정이 프로파일링 오버헤드를 더해 쿼리를 평소보다 오래 걸리게 할 수 있다고 하고, Using EXPLAIN의 Caveats는 결과 행을 클라이언트에 보내는 네트워크·변환 비용이 측정에 포함되지 않는다고 한다. MySQL 8.4 EXPLAIN 페이지는 EXPLAIN ANALYZE가 문장을 실행하고 반복자(iterator)별 예상 비용·행 수와 실제 시간·행 수·loops를 TREE 형식으로만 보여 준다고 하며, 대상은 SELECT, 여러 테이블 UPDATE·DELETE, TABLE 문이라고 한다. 버전 차이로, 현재 버전(18) EXPLAIN 문서에는 출력 변환 비용을 재는 SERIALIZE 옵션이 있고 ANALYZE를 쓰면 BUFFERS 정보가 자동으로 포함된다고 적혀 있다(PostgreSQL 16 문서에는 없는 내용이라 이 답변은 16 기준이다).
(실험 확인) PostgreSQL 16.15에서 위 SQL을 실행하면 EXPLAIN ANALYZE 안에서 `Update on orders (actual time=1.219..1.219 rows=0 loops=1)`처럼 실제 시간이 나왔고, 같은 트랜잭션 안의 count는 99, ROLLBACK 뒤에는 0이었다. 반대로 ANALYZE 없이 `EXPLAIN UPDATE`만 한 경우에는 count가 0 그대로였다(50만 행 orders 테이블). MySQL 8.4.11에서는 `EXPLAIN ANALYZE SELECT ... JOIN ...`이 `(cost=182850 rows=519448) (actual time=0.161..664 rows=500000 loops=1)` 형태의 트리를 출력했다(숫자는 실행마다 다르다).
