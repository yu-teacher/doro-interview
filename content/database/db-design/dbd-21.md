---
slug: "dbd-21"
topic: "db-design"
tier: TRICKY
difficulty: 3
title: "ALTER TABLE이 락을 못 얻어 대기만 해도 왜 서비스의 단순 조회까지 멈출 수 있나요?"
keywords: ["ACCESS EXCLUSIVE 대기", "앞선 긴 트랜잭션", "뒤따르는 SELECT도 대기", "lock_timeout", "idle in transaction 방치 금지"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/explicit-locking.html", "https://www.postgresql.org/docs/16/sql-altertable.html", "https://www.postgresql.org/docs/16/runtime-config-client.html"]
concepts: [online-schema-change, db-locking]
importance: 1
links: [{to: "dbl-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
ALTER TABLE이 필요로 하는 ACCESS EXCLUSIVE 락은 다른 모든 락과 충돌합니다. 그런데 어떤 트랜잭션이 그 테이블을 읽는 락을 쥔 채 열려 있으면 ALTER는 그 트랜잭션이 끝나기를 기다리고, 그 뒤에 새로 들어오는 단순 SELECT도 대기 중인 ALTER 뒤에 줄을 서서 막힐 수 있습니다. 즉 ALTER 자체는 빨라도 앞의 긴 트랜잭션 하나 때문에 서비스 조회가 멈춥니다. 대응은 DDL 세션에 짧은 lock_timeout을 걸어 못 얻으면 포기하고 나중에 재시도하는 것, 그리고 idle in transaction 같은 긴 트랜잭션을 방치하지 않는 것입니다.

```sql
-- DDL 세션
SET lock_timeout = '4s';
ALTER TABLE big ADD COLUMN e int;   -- 앞선 트랜잭션이 안 끝나면 4초 뒤 포기
```

(공식 문서) PostgreSQL 16 explicit-locking 페이지는 ACCESS EXCLUSIVE가 같은 테이블의 모든 다른 락 모드와 충돌하고, 교착 상태가 감지되지 않는 한 락을 기다리는 트랜잭션은 무한정 기다리므로 오래 열린 트랜잭션은 좋지 않다고 한다. runtime-config-client 페이지는 `lock_timeout`이 락을 기다리는 동안에만 발생하며 postgresql.conf 전역 설정은 권장하지 않는다고 한다. sql-altertable 페이지는 ALTER TABLE이 별도 언급 없으면 ACCESS EXCLUSIVE 락을 얻는다고 한다.
(실험 확인) PostgreSQL 16.15에서 세션 A가 트랜잭션 안에서 30만 행 테이블을 SELECT한 채 6초 열려 있고, 1초 뒤 세션 B가 `lock_timeout = 4s`로 `ALTER TABLE ... ADD COLUMN`을 시도했고, 2초 뒤 세션 C가 단순 `SELECT count(*)`를 실행했다. B는 4초 뒤 lock timeout 오류로 끝났고, 기준 시각을 0초로 두면 A는 0~6.1초, B는 1.0~5.1초, C는 3.0초에 시작해 B가 포기한 직후인 5.1초에야 끝났다(A는 6.1초까지 열려 있었음). B 없이 A와 C만 실행한 대조에서는 C가 시작 직후(약 0.1초)에 끝났다. 즉 C는 A가 아니라 대기 중인 B 때문에 막혔다.
(보충) 대기 중인 락 요청 뒤에 새 요청이 줄을 선다는 설명은 위 실험 결과에서 도출한 해석이며, 이 동작을 직접 설명하는 문서 문장은 확인하지 못했다.
