---
slug: "wfx-21"
topic: "spring-webflux"
tier: TRICKY
difficulty: 3
title: "가상 스레드를 쓰면 WebFlux는 필요 없어지나요? 둘은 어떻게 이어지나요?"
keywords: ["WebFlux의 비블로킹 가정", "spring.threads.virtual.enabled", "SimpleAsyncTaskExecutor", "boundedElastic 가상 스레드 옵션", "블로킹 격리 자리"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html", "https://projectreactor.io/docs/core/release/reference/coreFeatures/schedulers.html"]
concepts: [virtual-thread, nonblocking-model]
importance: 2
links: [{to: "wfx-06", kind: PREREQ}, {to: "wfx-11", kind: PREREQ}, {to: "jt-15", kind: RELATED}, {to: "mvc-17", kind: RELATED}, {to: "mvc-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
WebFlux는 블로킹하지 않는다고 가정하고 작고 고정된 이벤트 루프 스레드로 처리하며, 블로킹은 별도 스레드로 보내는 탈출구를 둡니다. Java 21 이상에서 `spring.threads.virtual.enabled=true`로 가상 스레드를 켜면, Executor 빈이 없을 때 Boot가 자동 구성하는 `AsyncTaskExecutor`는 가상 스레드용 `SimpleAsyncTaskExecutor`가 되고, 이 실행기는 WebFlux 블로킹 실행 지원에도 쓰입니다. Reactor도 3.6.0부터 Java 21 이상에서 시스템 속성 `reactor.schedulers.defaultBoundedElasticOnVirtualThreads=true`로 `boundedElastic`이 작업마다 가상 스레드를 쓰게 할 수 있습니다. 즉 대체라기보다 블로킹을 격리하는 자리에 끼워 넣는 선택지입니다.

(공식 문서, WebFlux 개요) WebFlux 쪽 전제는 애플리케이션이 블로킹하지 않는다는 것이고, 작고 고정된 이벤트 루프 워커 풀로 요청을 처리한다. 블로킹 호출은 `publishOn`으로 다른 스레드에서 이어 가는 탈출구가 있다. 이 문서에서 가상 스레드는 다루지 않는다.
(공식 문서, Spring Boot 작업 실행과 스케줄링) 문서는 Executor 빈이 없을 때의 자동 구성을 설명한다. 가상 스레드를 켜면(Java 21+, `spring.threads.virtual.enabled`가 `true`) 자동 구성되는 `AsyncTaskExecutor`는 가상 스레드를 쓰는 `SimpleAsyncTaskExecutor`가 되고, 그렇지 않으면 `ThreadPoolTaskExecutor`이다. 이 `AsyncTaskExecutor`는 `@EnableAsync`, Spring for GraphQL의 `Callable` 비동기 처리, Spring MVC의 비동기 요청 처리와 함께 Spring WebFlux의 블로킹 실행 지원에 쓰인다고 한다.
(공식 문서, Reactor Schedulers) 3.6.0부터 `Schedulers.boundedElastic()`은 설정에 따라 두 구현을 제공한다. 플랫폼 스레드를 재사용하는 `ExecutorService` 기반 구현(스레드 상한은 CPU 코어 수 곱하기 10, 상한 이후 최대 10만 개 작업 큐잉)과, Java 21+ 환경에서 시스템 속성 `reactor.schedulers.defaultBoundedElasticOnVirtualThreads`를 `true`로 켰을 때 작업마다 새 `VirtualThread`에서 실행하는 thread-per-task 구현이다.
(보충) "대체하는 것이 아니라 블로킹을 격리하는 자리에 쓸 수 있다"는 결론과, 가상 스레드 기반 MVC와 WebFlux 중 무엇을 고를지에 대한 판단은 위 문서 사실들에서 이끌어 낸 일반적인 정리이며 문서가 순위를 매긴 것이 아니다. `spring.threads.virtual.enabled`가 Tomcat 같은 서버의 요청 처리 스레드에 미치는 영향은 이 답의 근거에 포함하지 않았다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
