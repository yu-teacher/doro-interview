---
slug: "wfx-19"
topic: "spring-webflux"
tier: TRICKY
difficulty: 3
title: "WebFlux에서 `ThreadLocal`이나 MDC가 왜 문제가 되고, Reactor의 `Context`는 무엇인가요?"
keywords: ["스레드가 바뀜", "ThreadLocal 의존 문제", "MDC 상관관계 ID", "구독에 묶이는 불변 Context", "contextWrite·deferContextual"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/advancedFeatures/context.html", "https://projectreactor.io/docs/core/release/reference/faq.html"]
concepts: [thread-binding, observability]
importance: 1
links: [{to: "wfx-12", kind: PREREQ}, {to: "jt-18", kind: RELATED}, {to: "sec-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
리액티브에서는 하나의 스레드가 여러 비동기 시퀀스를 번갈아 처리하고, 한 시퀀스의 실행도 스레드 사이를 쉽게 옮겨 다닙니다. 그래서 데이터를 스레드에 묶어 두는 `ThreadLocal`에 의존하면 어려움이 생기고 심하면 잘못 동작하거나 실패합니다. Reactor 문서는 Logback의 MDC로 상관관계 ID를 담는 경우를 대표 사례로 듭니다. 값을 데이터와 함께 `Tuple2`로 흘리는 방식은 메서드 시그니처를 오염시킵니다. 그래서 Reactor 3.1부터 스레드가 아니라 각 구독에 묶이는 불변 `Context`를 제공하고, `contextWrite`로 쓰고 `deferContextual`로 읽습니다. 로그는 `doOnEach`에서 Context 값을 MDC로 옮겨 남기는 방식을 문서가 제안합니다.

(공식 문서, Reactor Adding a Context) 리액티브에서는 한 `Thread`가 거의 동시에 진행되는 여러 비동기 시퀀스를 처리하고 실행이 스레드를 자주 넘나들기 때문에 `ThreadLocal`처럼 더 안정적인 스레딩 모델에 의존하는 기능이 특히 어렵다고 설명한다. `ThreadLocal`에 의존하는 라이브러리는 Reactor와 쓸 때 문제가 생기고 최악에는 잘 동작하지 않거나 실패하며, Logback MDC로 상관관계 ID를 남기는 것이 대표 예라고 한다. 우회로로 값을 `Tuple2<T, C>`로 같이 흘리면 시그니처에 관심사가 새어 나간다. 3.1.0부터 제공되는 `Context`는 스레드가 아니라 `Flux`나 `Mono`에 적용되며, 불변이고 `put`은 새 인스턴스를 만든다. 각 `Subscriber`에 묶이고 구독 전파 메커니즘으로 연산자에게 노출된다. 쓰기는 `contextWrite`, 읽기는 `deferContextual`을 쓰며, 문서는 이를 주로 라이브러리 개발자를 겨냥한 고급 기능이라고 소개한다.
(공식 문서, Reactor FAQ MDC) 선언형 API에서 MDC가 그냥 동작한다고 가정하는 것은 좋은 가정이 아니라고 하며, `Context` 값을 `doOnEach` 안에서 MDC로 옮겨 넣고 로그를 남기는 헬퍼 예제를 소개한다. 쓰기는 연산자 체인의 아래쪽에서 일어나야 위쪽 연산자가 볼 수 있다고 덧붙인다.
(공식 문서, Spring R2DBC) `R2dbcTransactionManager`가 연결을 구독자 `Context`에 바인딩한다고 쓴다. WebFlux와 Spring Security의 보안 컨텍스트 전파 방식은 읽지 않았다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
