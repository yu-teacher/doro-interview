---
slug: "bat-19"
topic: "spring-batch"
tier: TRICKY
difficulty: 3
title: "멀티스레드 스텝에서 ItemProcessor를 쓸 때 주의할 점은 무엇인가요?"
keywords: ["프로세서는 스레드 안전해야", "트랜잭션은 스레드에 묶임", "워커 스레드는 청크 트랜잭션에 불참", "읽기·쓰기는 메인 스레드", "로컬 청킹"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/scalability.html"]
concepts: [race-condition, thread-pool]
importance: 1
links: [{to: "bat-13", kind: PREREQ}, {to: "jt-07", kind: RELATED}, {to: "jt-19", kind: RELATED}]
---
**모범 답변 (30~60초)**
스텝에 TaskExecutor를 붙이면 여러 스레드가 동시에 ItemProcessor를 호출하므로 프로세서가 스레드 안전해야 하고, 상태를 가진 협력 객체는 동기화해야 합니다. 스프링 트랜잭션은 스레드에 묶여 있어서 워커 스레드에서 도는 프로세서는 스텝의 청크 트랜잭션에 참여하지 않습니다. 그래서 프로세서에서 트랜잭션이 필요하면 REQUIRED로 자기 트랜잭션을 시작해야 하고, 기존 트랜잭션을 요구하는 MANDATORY는 활성 트랜잭션이 없으면 실패합니다. 반면 읽기와 쓰기는 메인 스레드가 직렬로 하므로 reader와 writer는 스레드 안전하지 않아도 됩니다. 청크 전체를 워커에서 처리하려면 로컬 청킹을 고려합니다.

(공식 문서) Scaling and Parallel Processing 페이지(현행 6.0판)의 Multi-threaded Step 절은 TaskExecutor를 붙이면 ItemProcessor가 여러 스레드에서 동시에 호출되어 스레드 안전해야 하고, 스프링 트랜잭션은 스레드에 묶이므로 워커 스레드의 프로세서 호출이 스텝의 청크 트랜잭션에 참여하지 않는다고 한다. 프로세서가 트랜잭션이 필요하면 직접 시작해야 하고(예: REQUIRED), MANDATORY는 활성 트랜잭션이 없으면 실패한다. 읽기와 쓰기는 스텝을 실행하는 메인 스레드가 직렬로 하므로 reader와 writer는 스레드 안전할 필요가 없고, 처리량이 읽기·쓰기에 막히면 로컬 청킹이나 로컬 파티셔닝을 고려하라고 한다. 풀링된 자원(DataSource)의 풀을 원하는 동시 스레드 수 이상으로 두라고도 한다.
(보충) 이 동작은 문서 현행판(6.0) 기준이다. 이전 버전의 멀티스레드 스텝 설명과 reader의 스레드 안전성 요구가 같은지는 확인하지 않았다.
(실험하지 않았다) 문서 근거로만 썼다.
