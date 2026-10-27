---
slug: "wfx-16"
topic: "spring-webflux"
tier: BASIC
difficulty: 2
title: "리액티브 코드는 어떻게 테스트하나요? `StepVerifier`는 무엇인가요?"
keywords: ["StepVerifier 시나리오", "expectNext·expectComplete", "verify()로 구독 실행", "verify 기본 타임아웃 없음", "withVirtualTime·WebTestClient"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/testing.html", "https://docs.spring.io/spring-framework/reference/web/webflux-test.html"]
concepts: [test-strategy, reactive-programming]
importance: 2
links: [{to: "wfx-04", kind: PREREQ}, {to: "tst-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
Reactor는 `reactor-test`의 `StepVerifier`로 시퀀스를 시나리오처럼 검증합니다. `StepVerifier.create(flux)`로 감싸고 `expectNext`, `expectNextCount`, `consumeNextWith` 같은 메서드로 기대하는 신호를 순서대로 적은 뒤, `expectComplete`나 `expectError` 같은 종료 기대와 `verify()`를 호출해야 실제로 구독해서 검증합니다. `verify()`는 기본적으로 타임아웃이 없어 영원히 블로킹할 수 있어서 필요하면 시간 제한을 지정하고, 지연 연산자는 `StepVerifier.withVirtualTime`으로 가상 시간에서 기다림 없이 테스트합니다. HTTP 계층은 서버 없이도 쓸 수 있는 `WebTestClient`로 테스트합니다.

(공식 문서, Reactor Testing) `StepVerifier`로 다음에 기대하는 이벤트를 단계별로 표현한다. 신호를 기대하는 `expectNext(T…)`, `expectNextCount(long)`, 다음 신호를 소비하는 `consumeNextWith(Consumer<T>)`, 일시 정지나 코드 실행을 위한 `thenAwait(Duration)`, `then(Runnable)` 등을 제공한다. 종료 기대 메서드(`expectComplete()`, `expectError()`)는 더 이상 기대를 쓸 수 없는 단계로 전환해, 이후 `verify()` 등으로 검증을 실행한다. `verify()`는 테스트를 촉발하는 단계이며 호출을 잊으면 검증이 일어나지 않는다. `verifyComplete()`, `verifyError()` 같은 단축이 있다. 기본적으로 `verify()` 계열은 타임아웃이 없어 무기한 블록할 수 있고 `StepVerifier.setDefaultTimeout(Duration)`이나 `verify(Duration)`으로 시간 제한을 둔다.
(공식 문서, 같은 페이지) `StepVerifier.withVirtualTime`은 `Supplier`를 받아, 가상 시간 스케줄러가 활성화된 뒤에 테스트 대상 Flux가 지연 생성되도록 한다. `Flux`를 미리 만들어 두고 Supplier가 그 변수를 돌려주면 가상 시간이 보장되지 않는다. 시간 관련 기대로 `thenAwait`, `expectNoEvent`가 있다.
(공식 문서, Spring Testing WebFlux) `spring-test`가 `ServerHttpRequest`, `ServerHttpResponse`, `ServerWebExchange`의 목 구현을 제공하고, `WebTestClient`는 이 목을 기반으로 HTTP 서버 없이 WebFlux 앱을 테스트하며 종단 간 통합 테스트에도 쓸 수 있다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
