---
slug: "dbl-03"
topic: "db-lock"
tier: BASIC
difficulty: 1
title: "낙관적 락과 비관적 락은 어떻게 다르고, SQL로는 각각 어떻게 구현하나요?"
keywords: ["충돌 가정 여부", "version 컬럼 조건부 UPDATE", "영향 행 0이면 충돌", "FOR UPDATE로 선점"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/applevel-consistency.html"]
---
**모범 답변 (30~60초)**
비관적 락은 충돌이 날 것이라고 보고, 읽는 시점에 SELECT FOR UPDATE로 행을 먼저 잠가서 다른 트랜잭션을 기다리게 합니다. 낙관적 락은 DB 락을 길게 잡지 않고 version 컬럼 같은 값을 읽어 두었다가, UPDATE ... WHERE id = ? AND version = ? 로 갱신해서 영향받은 행이 0개면 그 사이 누가 바꾼 것이니 다시 읽고 재시도하거나 오류로 처리합니다. 충돌이 드문 곳에서는 낙관적 락이 대기가 없어 유리하고, 충돌이 잦으면 재시도가 늘어 비관적 락이 낫습니다. 비관적 락은 확실하지만 대기와 데드락 위험이 있어서 락을 쥔 채 오래 머물면 안 됩니다. 두 방식 모두 SQL 사용 패턴이라 PostgreSQL이든 MySQL이든 똑같이 적용됩니다.

```sql
-- 낙관적: version이 읽을 때와 같을 때만 갱신. 영향 행 수가 0이면 충돌
UPDATE accounts SET balance = 110, version = version + 1
 WHERE id = 1 AND version = 1;
-- 비관적: 먼저 잠그고 갱신
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
```

(공식 문서) FOR UPDATE의 효과와, 락을 잡은 채 트랜잭션을 오래 열어 두면 안 된다는 경고는 explicit-locking 13.3.2~13.3.4절에 있다. applevel-consistency 13.4.2절은 비직렬화 쓰기가 가능할 때 행의 현재 유효성을 지키려면 SELECT FOR UPDATE 등을 써야 한다고 한다.
(실험 확인) PostgreSQL 16.15에서 두 세션이 모두 `version=1`을 읽었다고 가정하고 같은 조건부 UPDATE를 차례로 실행했다. 첫 번째는 balance 110, version 2로 갱신됐고 두 번째는 조건(`version=1`)이 맞지 않아 아무 행도 바꾸지 못했다(최종 balance 110, version 2). 첫 세션이 갱신을 커밋하지 않은 동안 두 번째 세션의 조건부 UPDATE는 기다렸다가 0행을 돌려줬다. MySQL 8.4.11(InnoDB)에서도 같은 조건부 UPDATE는 첫 번째가 `Rows matched: 1`, 두 번째가 `Rows matched: 0`이었다.
(보충) '낙관적 락', 'version 컬럼'이라는 패턴 이름과 두 방식의 장단점 비교는 공식 문서가 아니라 일반적인 설계 지식이다. 이 이름을 문서가 직접 정의하지는 않는다.
