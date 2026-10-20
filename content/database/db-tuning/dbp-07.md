---
slug: "dbp-07"
topic: "db-tuning"
tier: BASIC
difficulty: 2
title: "N+1 쿼리 문제를 데이터베이스 쪽에서 보면 무엇이 문제이고 어떻게 줄이나요?"
keywords: ["쿼리 N번 추가", "쿼리마다 왕복과 트랜잭션", "JOIN 한 번", "ANY·IN으로 묶어 조회", "개별 쿼리는 빨라 보임"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/sql-prepare.html", "https://www.postgresql.org/docs/16/functions-comparisons.html", "https://www.postgresql.org/docs/16/using-explain.html"]
concepts: [fetch-strategy, join-query]
importance: 3
links: [{to: "jpa-15", kind: RELATED}, {to: "jpa-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
N+1은 목록을 한 번 조회한 뒤 그 행마다 연관 데이터를 가져오는 쿼리가 N번 더 나가는 패턴입니다. 데이터베이스 쪽에서 보면 쿼리마다 파싱과 계획, 네트워크 왕복, 트랜잭션 처리가 반복되고, 개별 쿼리는 인덱스를 타서 빨라 보이기 때문에 슬로우 쿼리로는 잘 안 잡힙니다. PostgreSQL 16 기준으로 JOIN 한 번이나 WHERE customer_id = ANY(...), IN으로 묶어 가져오면 플래너가 해시 조인 같은 집합 연산을 고를 수 있어 왕복이 줄어듭니다. 다만 한 번에 너무 많은 값을 넣으면 쿼리와 결과가 커지므로 적당한 크기로 나누는 균형이 필요합니다.

```sql
-- N+1: 1번 + 1,000번
SELECT id FROM customers WHERE id <= 1000;
SELECT id, amount FROM orders WHERE customer_id = $1;   -- 고객마다 반복

-- 한 번에
SELECT c.id, o.id, o.amount
FROM customers c JOIN orders o ON o.customer_id = c.id
WHERE c.id <= 1000;
```

(공식 문서) PREPARE 페이지는 범용 계획을 쓰면 계획 수립 오버헤드를 피할 수 있다고 설명하는데, 이는 같은 문장을 반복 실행할 때의 오버헤드를 줄이는 장치일 뿐 쿼리 개수 자체를 줄여 주지는 않는다. Row and Array Comparisons 절은 `expression = ANY (array)` 형태로 값 목록과 비교하는 문법을 정의한다. 문서가 'N+1'이라는 이름을 직접 쓰지는 않는다.
(실험 확인) PostgreSQL 16.15, 고객 1,000명 대상으로 psql 하나에 1,001개 쿼리를 순서대로 보내자 pg_stat_database의 xact_commit이 1,001 늘었고(자동 커밋, 측정 오버헤드 3을 제외), JOIN 한 번은 1이었다. 같은 컨테이너 안 소켓 연결이라 시간 차는 작아서 1,001개 쿼리가 0.18~0.29초, ANY 한 번이 약 0.1초, JOIN 한 번이 약 0.11~0.13초였다. JOIN 쿼리의 계획은 Hash Join(실행 25~52ms)이었다.
(보충) 개별 쿼리가 빨라서 슬로우 쿼리 기록에는 잘 안 잡힌다는 점, 네트워크 지연이 있는 환경에서는 왕복 횟수만큼 차이가 커진다는 설명과, ORM의 지연 로딩이 이 패턴의 흔한 원인이라는 설명은 일반적 지식이며 위 실험에서 직접 재지 않았다.
