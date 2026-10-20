---
slug: "dbl-14"
topic: "db-lock"
tier: DEEP
difficulty: 3
title: "이미 다른 트랜잭션이 수정 중인 행을 UPDATE하면 READ COMMITTED와 REPEATABLE READ에서는 각각 어떻게 되나요?"
keywords: ["락 대기 후 재평가", "갱신된 행 버전에 적용", "could not serialize access", "트랜잭션 전체 재시도"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.postgresql.org/docs/16/transaction-iso.html", "https://www.postgresql.org/docs/16/applevel-consistency.html"]
concepts: [isolation-level, mvcc]
importance: 2
links: [{to: "dbl-04", kind: PREREQ}, {to: "dbl-18", kind: FOLLOWUP}, {to: "dbt-17", kind: RELATED}, {to: "dbt-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
PostgreSQL 16에서 UPDATE는 먼저 자기 스냅샷에서 대상 행을 찾고, 그 행이 이미 다른 트랜잭션에 의해 수정 중이면 그 트랜잭션이 끝나길 기다립니다. 상대가 롤백하면 원래 행을 그대로 갱신합니다. 상대가 커밋하면 READ COMMITTED에서는 삭제됐으면 건너뛰고, 아니면 갱신된 행 버전에 WHERE 조건을 다시 평가해 맞으면 그 버전에 갱신을 적용합니다. REPEATABLE READ 이상에서는 트랜잭션 시작 뒤에 바뀐 행은 건드릴 수 없어서 could not serialize access due to concurrent update 오류로 중단되고, 애플리케이션이 트랜잭션을 처음부터 재시도해야 합니다. 그래서 READ COMMITTED의 한 문장은 다른 행에 대해서는 일관되지 않은 스냅샷을 볼 수 있습니다.

(공식 문서) transaction-iso 13.2.1절: READ COMMITTED에서 UPDATE, DELETE, SELECT FOR UPDATE는 명령 시작 시점에 커밋된 행만 대상으로 찾고, 이미 갱신 중이면 대기한 뒤 갱신된 행 버전에 WHERE 조건을 재평가해 맞으면 진행한다. 그래서 한 명령이 같은 행에 대한 동시 갱신의 결과는 보지만 다른 행에 대한 영향은 보지 못해 복잡한 검색 조건에는 적합하지 않다고 하며, `website.hits` 9, 10 예시(UPDATE 도중 DELETE hits = 10이 효과 없음)를 든다. applevel-consistency 13.4절은 READ COMMITTED에서는 한 문장도 쓰기 충돌이 생기면 문장 스냅샷을 벗어날 수 있다고 한다. 13.2.2절: REPEATABLE READ에서는 같은 경우 `ERROR: could not serialize access due to concurrent update`가 나고 트랜잭션을 처음부터 재시도해야 한다.
(실험 확인) PostgreSQL 16.15, 두 행 `hits=9`, `hits=10` 테이블에서 세션 A가 `UPDATE website SET hits = hits + 1`을 하고 커밋하지 않은 동안 세션 B가 `DELETE FROM website WHERE hits = 10`을 실행했다. READ COMMITTED의 B는 A의 커밋 뒤 0행을 지웠다(행이 11로 바뀌어 조건에 안 맞음). REPEATABLE READ의 B는 먼저 `SELECT`로 `hits=10` 행을 볼 수 있었지만 DELETE는 A 커밋 후 `could not serialize access due to concurrent update`로 실패했다.
