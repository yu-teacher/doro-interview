---
slug: "bat-21"
topic: "spring-batch"
tier: TRICKY
difficulty: 3
title: "처리 여부 컬럼으로 재실행 가능한 리더를 만들 때 왜 `saveState`를 끄나요?"
keywords: ["기본은 위치를 ExecutionContext에 저장", "처리 여부 플래그 컬럼", "미처리 행만 조회", "재시작 때 행 번호는 의미 없음", "saveState false"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/readers-and-writers/process-indicator.html", "https://docs.spring.io/spring-batch/reference/readers-and-writers/database.html"]
concepts: [batch-job-metadata, idempotency]
importance: 1
links: [{to: "bat-09", kind: PREREQ}, {to: "bat-12", kind: PREREQ}]
---
**모범 답변 (30~60초)**
기본적으로 reader와 writer는 커밋 전에 현재 위치, 예를 들어 읽은 행 수를 ExecutionContext에 저장하고, 재시작하면 그 위치부터 이어서 읽습니다. 그런데 입력 테이블에 처리 여부 컬럼을 두고 처리되지 않은 행만 조회하는 방식에서는 처리한 행이 조건에서 빠지므로, 재시작 때 쿼리가 알아서 남은 행만 돌려줍니다. 이 경우 저장한 행 번호는 재시작 때 의미가 없어서, 문서는 상태를 저장하지 않는 편이 낫다고 하고 모든 reader와 writer가 `saveState` 속성을 가진다고 설명합니다.

(공식 문서) Preventing State Persistence 페이지는 기본적으로 모든 ItemReader와 ItemWriter 구현이 커밋 전에 현재 상태를 ExecutionContext에 저장한다고 하며, 입력 데이터에 처리 여부 컬럼을 두고 `where PROCESSED_IND = false`처럼 미처리 행만 읽게 하는 방식에서는 현재 행 번호 같은 상태가 재시작 때 의미가 없으니 저장하지 않는 것이 좋다고 한다. 이를 위해 reader와 writer에 saveState 속성이 있고 예제는 saveState(false)를 보여 준다. Database 페이지의 JdbcCursorItemReader 속성표도 saveState 기본값이 true라고 한다.
(보충) 상태를 복원하면 이미 줄어든 결과 집합에서 일부를 건너뛰어 누락될 수 있다는 것은 추론이며 문서가 직접 말한 내용은 아니다.
(실험하지 않았다) 문서 근거로만 썼다.
