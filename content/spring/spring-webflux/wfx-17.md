---
slug: "wfx-17"
topic: "spring-webflux"
tier: TRICKY
difficulty: 3
title: "WebFlux 컨트롤러에서 `block()`을 호출하면 왜 안 되나요? `block()`이 허용되는 곳은 어디인가요?"
keywords: ["스레드를 세움", "리액티브 타입을 그대로 반환", "parallel·single에서 IllegalStateException", "여러 호출은 Mono.zip 후 한 번 block", "테스트나 서블릿 MVC"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-synchronous.html", "https://projectreactor.io/docs/core/release/reference/coreFeatures/schedulers.html", "https://projectreactor.io/docs/core/release/reference/reactiveProgramming.html"]
concepts: [nonblocking-model]
importance: 2
links: [{to: "wfx-11", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`block()`은 결과가 올 때까지 현재 스레드를 세우는 호출이라, 적은 스레드로 많은 요청을 처리하려는 논블로킹 스택의 전제를 깹니다. Spring 문서는 `Flux`나 `Mono`를 쓴다면 MVC든 WebFlux든 컨트롤러에서 블로킹할 일이 없어야 하고, 그냥 리액티브 타입을 반환하라고 권고합니다. Reactor도 기본 `parallel`과 `single` 스케줄러 위에서 `block()` 같은 블로킹 API를 쓰면 `IllegalStateException`을 던져 막아 둡니다. `block()`이 쓰이는 곳은 블로킹이 허용되는 경계로, 예를 들어 테스트나 서블릿 기반 MVC 앱에서 `WebClient`를 동기식으로 쓸 때입니다. 이때도 여러 호출이면 각각 `block()` 하지 말고 `Mono.zip`으로 묶어 한 번만 블로킹하는 것이 더 효율적이라고 문서가 말합니다.

(공식 문서, WebClient 동기 사용) `bodyToMono(...).block()`처럼 마지막에 블로킹해 동기 스타일로 쓸 수 있지만, 여러 호출이 필요하면 각 응답마다 블로킹하지 말고 `Mono.zip`으로 결합한 결과를 기다리는 것이 더 효율적이라고 한다. `Flux`나 `Mono`를 쓰면 Spring MVC나 WebFlux 컨트롤러에서 절대 블로킹할 필요가 없어야 하며 결과 리액티브 타입을 반환하면 된다고 쓴다.
(공식 문서, Reactor Schedulers) `boundedElastic`은 레거시 블로킹 코드를 위한 것이고 `single`, `parallel`은 그렇지 않아서, 기본 `single`, `parallel` 스케줄러 안에서 `block()`, `blockFirst()`, `blockLast()`나 `toIterable()`, `toStream()` 순회를 쓰면 `IllegalStateException`이 던져진다. `NonBlocking` 마커 인터페이스를 구현한 `Thread`로 사용자 정의 스케줄러를 논블로킹 전용으로 표시할 수도 있다.
(공식 문서, Spring WebFlux 개요 Applicability) 원격 서비스를 호출하는 Spring MVC 앱에는 리액티브 `WebClient`를 써 보라고 권한다. (공식 문서, Reactor 레퍼런스) 예제의 `result.block()`은 테스트 안이어서 블로킹해 결과를 단정한다고 설명한다.
(보충) 답변에서 `block()`이 허용되는 곳으로 서블릿 MVC 앱의 `WebClient` 동기 사용을 든 것은, 위 두 문서 서술(MVC에서 `WebClient` 사용 권고, 동기 사용 절)을 합친 정리이다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
