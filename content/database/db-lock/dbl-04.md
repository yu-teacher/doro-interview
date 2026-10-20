---
slug: "dbl-04"
topic: "db-lock"
tier: BASIC
difficulty: 2
title: "갱신 손실(lost update)은 무엇이고 PostgreSQL에서는 어떻게 막나요?"
keywords: ["읽고 계산해 쓰기 덮어쓰기", "balance = balance + n 원자적 UPDATE", "SELECT FOR UPDATE", "REPEATABLE READ 직렬화 실패 재시도"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/applevel-consistency.html"]
---
**모범 답변 (30~60초)**
두 트랜잭션이 같은 값을 읽은 뒤 각자 계산한 결과를 쓰면, 나중에 쓴 쪽이 먼저 쓴 쪽의 변경을 덮어써서 한쪽 갱신이 사라지는 문제입니다. PostgreSQL 16에서 가장 간단한 해법은 값을 애플리케이션으로 꺼내지 않고 UPDATE accounts SET balance = balance + 10 처럼 DB 안에서 갱신하는 것입니다. 기본 격리 수준인 READ COMMITTED에서는 두 번째 UPDATE가 첫 트랜잭션의 커밋을 기다렸다가 갱신된 행에 다시 적용되기 때문입니다. 읽어서 애플리케이션에서 계산해야 하면 SELECT FOR UPDATE로 먼저 잠그거나 버전 컬럼으로 낙관적 락을 씁니다. REPEATABLE READ 이상에서는 다른 트랜잭션이 먼저 커밋한 행을 바꾸려 하면 오류가 나므로 트랜잭션 전체를 재시도해야 합니다.

(공식 문서) transaction-iso 13.2.1절: READ COMMITTED에서 UPDATE 대상 행이 이미 다른 트랜잭션에 의해 갱신 중이면 그 트랜잭션이 끝나기를 기다리고, 커밋되면 갱신된 행 버전에 연산을 적용한다(WHERE 조건은 다시 평가). 13.2.2절: REPEATABLE READ에서는 같은 상황에서 `ERROR: could not serialize access due to concurrent update`가 나고, 애플리케이션은 트랜잭션을 처음부터 재시도해야 한다. 13.2.1절은 `balance = balance + 100.00` 형태의 UPDATE를 단순한 경우의 올바른 예로 든다. applevel-consistency 13.4.2절은 비직렬화 쓰기가 가능할 때 행의 현재 유효성을 지키려면 SELECT FOR UPDATE 등을 써야 한다고 한다.
(실험 확인) PostgreSQL 16.15, 초기 balance 100에서 두 세션이 각각 +10, +20을 반영했다(B가 먼저 커밋하도록 시간차를 둠). 결과는 다음과 같았다.

| 방식 | 최종 balance | 비고 |
|---|---|---|
| READ COMMITTED, SELECT 후 앱에서 `read+n`을 쓰기 | 110 | +20이 사라짐(갱신 손실) |
| READ COMMITTED, SELECT FOR UPDATE | 130 | 둘 다 반영 |
| REPEATABLE READ, 일반 SELECT | 120 | 늦은 쪽이 `could not serialize access` 오류 |
| REPEATABLE READ, SELECT FOR UPDATE | 110 | 대기하던 쪽이 같은 오류(재시도 필요) |
| `SET balance = balance + n` | 130 | 둘 다 반영 |

(보충) '갱신 손실(lost update)'이라는 용어는 이번에 읽은 PostgreSQL 16 문서 본문에는 나오지 않았다. 문서가 설명하는 동작을 이 용어에 맞춰 풀어 쓴 것이다. 버전 컬럼으로 하는 낙관적 락도 문서가 아니라 일반적인 설계 패턴이다(dbl-03).
