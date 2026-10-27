---
slug: "wfx-11"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "이벤트 루프 스레드에서 블로킹 호출을 하면 왜 문제이고, 블로킹 API는 어떻게 감싸서 쓰나요?"
keywords: ["소수의 이벤트 루프 스레드", "블로킹이 다른 요청을 막음", "Mono.fromCallable", "subscribeOn(boundedElastic)", "블로킹 API는 모델과 안 맞음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://projectreactor.io/docs/core/release/reference/faq.html", "https://projectreactor.io/docs/core/release/reference/coreFeatures/schedulers.html"]
concepts: [nonblocking-model, thread-pool]
importance: 3
links: [{to: "wfx-01", kind: PREREQ}, {to: "wfx-12", kind: FOLLOWUP}, {to: "wfx-17", kind: FOLLOWUP}, {to: "jt-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
논블로킹 서버는 CPU 코어 수 정도의 작고 고정된 이벤트 루프 스레드로 요청을 처리한다고 가정합니다. 그 스레드에서 블로킹 호출을 하면 같은 스레드가 맡은 다른 요청의 처리까지 멈춥니다. 블로킹 라이브러리가 꼭 필요하면 `Mono.fromCallable`로 감싸고 `subscribeOn(Schedulers.boundedElastic())`로 전용 스레드에서 실행하게 합니다. `boundedElastic`은 만드는 스레드 수와 대기 작업 수에 상한이 있어 급증해도 시스템을 덜 압박합니다. 다만 Spring 문서는 이것이 탈출구일 뿐 블로킹 API는 이 동시성 모델에 잘 맞지 않는다고 하고, JPA나 JDBC 같은 블로킹 영속 API를 쓴다면 일반적인 구조에서는 Spring MVC가 낫다고 권고합니다.

(공식 문서, WebFlux 개요 Concurrency Model, Threading Model) MVC는 애플리케이션이 현재 스레드를 블로킹할 수 있다고 가정해 큰 스레드 풀을 쓰고, WebFlux는 블로킹하지 않는다고 가정해 작고 고정된 이벤트 루프 워커 스레드 풀을 쓴다고 한다. 평범한 WebFlux 서버에서는 서버용 스레드 하나와 요청 처리용 스레드(대개 CPU 코어 수)를 기대할 수 있다고 쓴다. 블로킹 라이브러리는 `publishOn`으로 다른 스레드에서 처리를 이어 가는 탈출구가 있지만 블로킹 API는 이 모델에 맞지 않는다고 하고, 블로킹 영속 API(JPA, JDBC)나 네트워크 API가 있으면 일반적인 아키텍처에서는 Spring MVC가 최선이라고 평가한다. 블로킹 호출을 별도 스레드에서 하는 것은 기술적으로 가능하지만 논블로킹 스택의 이점을 다 누리지 못한다고 한다.
(공식 문서, Reactor FAQ "Wrap a Synchronous, Blocking Call") `Mono.fromCallable(...)`로 만들고 `subscribeOn(Schedulers.boundedElastic())`를 붙이는 패턴을 소개한다. 값이 하나면 `Mono`를 쓰고, `boundedElastic`은 논블로킹 처리에 영향을 주지 않고 블로킹 자원을 기다릴 전용 스레드를 만들면서도 스레드 수와 급증 시 지연되는 작업 수에 한계를 둔다고 한다. `subscribeOn`은 소스 바로 뒤에 둔다.
(공식 문서, Reactor Schedulers) `boundedElastic`은 상한 있는 탄력적 스레드 풀로 블로킹 I/O 작업에 알맞은 선택이다. 기본 스레드 상한은 CPU 코어 수 곱하기 10이고, 상한 이후 최대 10만 개 작업이 큐에 쌓인다고 한다.
(실험 확인) 위 모델의 비유로, 스레드가 하나뿐인 `ExecutorService`에 500ms 동안 잠드는 작업을 먼저 넣고 그 뒤에 짧은 작업을 넣으면 짧은 작업이 약 500ms(재실행 501ms) 뒤에야 시작되었다(JDK 25). Netty나 Reactor를 쓴 실험이 아니라 단일 스레드 큐에서 블로킹 작업이 뒤 작업을 막는다는 구조만 보여 준 것이다.
