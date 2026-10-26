---
slug: "bat-18"
topic: "spring-batch"
tier: TRICKY
difficulty: 3
title: "스텝이 쓰는 트랜잭션과 JobRepository(메타데이터) 트랜잭션이 분리되어 있으면 어떤 위험이 있고 어떻게 대비하나요?"
keywords: ["트랜잭션 매니저 분리", "처리 후 저장소 갱신 전 장애", "스텝 재실행으로 중복 처리", "멱등 처리", "JTA 같은 외부 트랜잭션"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/step/chunk-oriented-processing/configuring.html", "https://docs.spring.io/spring-batch/reference/readers-and-writers/process-indicator.html"]
concepts: [tx-boundary, batch-job-metadata]
importance: 1
links: [{to: "bat-07", kind: PREREQ}, {to: "bat-20", kind: FOLLOWUP}, {to: "tx-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
스텝이 쓰는 트랜잭션 매니저는 잡 저장소가 쓰는 것과 다를 수 있습니다. 문서는 이 경우 둘이 같은 트랜잭션이 아니어서, 처리는 끝났는데 저장소가 갱신되기 전에 장애가 나면 스텝이 다시 실행되어 같은 데이터를 중복 처리할 수 있다고 짚습니다. 대비책으로 문서가 든 것이 멱등 처리와 JTA 같은 외부 트랜잭션 관리입니다. 멱등하다는 것은 같은 입력을 두 번 처리해도 결과가 한 번과 같다는 뜻이라서, 처리 완료 표시 컬럼이나 고유 키 기준 갱신처럼 설계합니다. 재시작이 있으니 중복 실행을 전제로 짜는 게 안전합니다.

(공식 문서) Configuring a Step 페이지는 스텝이 쓰는 트랜잭션 매니저가 잡 저장소의 것과 다를 수 있다고 하며, 이때 잡 저장소와 처리 대상 DB가 같은 트랜잭션에 있지 않으므로 처리 뒤 저장소 갱신 전에 장애가 나면 스텝이 재실행되어 중복 처리가 생길 수 있다고 주의를 준다. 완화책으로 멱등 처리나 외부 트랜잭션 관리(예: JTA)를 든다. Preventing State Persistence 페이지는 입력 테이블에 처리 여부 컬럼을 두고 미처리 행만 읽는 방식을 재실행 가능한 리더의 예로 든다.
(보충) 처리 완료 표시 컬럼이나 고유 키 기준의 갱신(upsert) 같은 구체적 멱등 설계 방법은 일반적인 실무 설명이다. 문서는 처리 여부 컬럼을 재실행 가능한 리더의 예로 들었을 뿐 중복 방지책으로 나열하지 않았다.
(실험하지 않았다) 문서 근거로만 썼다.
