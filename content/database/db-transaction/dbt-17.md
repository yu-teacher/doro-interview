---
slug: "dbt-17"
topic: "db-transaction"
tier: TRICKY
difficulty: 3
title: "READ COMMITTED에서 두 트랜잭션이 같은 행을 UPDATE하면 어떻게 되고, 그래도 lost update가 생기는 경우는 언제인가요?"
keywords: ["끝나기를 기다립니다", "WHERE 조건을 다시 평가", "한 문장짜리 증가", "lost update", "SELECT FOR UPDATE"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/explicit-locking.html"]
---
**모범 답변 (30~60초)**
PostgreSQL 16의 READ COMMITTED에서 UPDATE는 대상 행을 다른 트랜잭션이 먼저 수정 중이면 그 트랜잭션이 끝나기를 기다립니다. 먼저 한 쪽이 커밋하면 갱신된 버전에 WHERE 조건을 다시 평가해 맞으면 그 버전에 적용합니다. 그래서 balance = balance + 100 같은 한 문장짜리 증가는 동시에 실행해도 둘 다 반영됩니다. 하지만 애플리케이션이 SELECT로 값을 읽어 계산한 뒤 UPDATE로 쓰면 읽은 값이 이미 낡아서 다른 트랜잭션의 변경을 덮어쓰는 lost update가 납니다. 이럴 때는 SELECT FOR UPDATE로 읽거나 상위 격리 수준과 재시도를 씁니다.

```sql
-- 안전: 한 문장에서 현재 값을 기준으로 계산
UPDATE acc SET bal = bal + 100 WHERE id = 1;

-- lost update 가능: 읽은 값을 앱에서 계산해 쓴다 (READ COMMITTED)
BEGIN; SELECT bal FROM acc WHERE id = 1;   -- 100
UPDATE acc SET bal = 100 + 50 WHERE id = 1; COMMIT;

-- 방지: 읽을 때 행을 잠근다
BEGIN; SELECT bal FROM acc WHERE id = 1 FOR UPDATE; ...
```

(공식 문서) Read Committed 절은 UPDATE·DELETE·SELECT FOR UPDATE가 이미 수정 중인 행을 만나면 먼저 수정한 트랜잭션을 기다리고, 커밋되면 삭제된 행은 무시하고 아니면 갱신된 버전에 적용하며 WHERE를 재평가한다고 한다. 하지만 이 때문에 한 명령이 같은 행의 동시 변경은 보면서 다른 행의 변경은 못 보는 불일치한 스냅샷을 볼 수 있어 복잡한 검색 조건에는 부적합하다고 하고, hits가 9와 10인 행에서 동시 UPDATE 뒤의 DELETE가 아무것도 지우지 못하는 예를 든다. 계좌 잔액 증가 같은 단순한 경우에는 알맞다고 한다.
(실험 확인) PostgreSQL 16.15에서 잔액 100에 두 트랜잭션이 각각 +100 UPDATE를 하자 결과는 300이었고 두 번째는 첫 트랜잭션 커밋까지 약 1.5초 기다렸다(환경·타이밍에 따라 다르다). 앱에서 읽은 100에 50을 더해 쓰는 트랜잭션과 +100이 겹치면 결과가 150(+100 유실)이었고, 읽기를 `FOR UPDATE`로 바꾸면 250이었다. 문서의 website 예시도 재현해 DELETE가 아무 행도 지우지 못하고 10, 11이 남았다.
