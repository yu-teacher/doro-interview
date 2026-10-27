---
slug: "scl-07"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "Spring Cloud Circuit Breaker는 무엇이고 Resilience4j와는 어떤 관계인가요?"
keywords: ["구현체 추상화 API", "CircuitBreakerFactory로 생성·실행", "폴백 함수", "Resilience4J·Spring Retry·Framework Retry 구현", "Customizer 빈으로 설정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-circuitbreaker.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/index.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-framework-retry.html"]
concepts: [resilience]
importance: 3
links: [{to: "scl-13", kind: FOLLOWUP}, {to: "scl-19", kind: FOLLOWUP}, {to: "dst-13", kind: RELATED}, {to: "dst-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
서킷 브레이커 구현에 종속되지 않도록 일관된 API를 제공하는 추상화이고, Resilience4j는 그 구현체 중 하나입니다. 스타터를 클래스패스에 넣으면 `CircuitBreakerFactory` 빈이 만들어지고, `create("slow").run(supplier, fallback)`처럼 보호할 코드와 서킷이 열렸을 때 실행할 폴백 함수를 넘깁니다. 리액티브 코드에는 `ReactiveCircuitBreakerFactory`가 있습니다. 프로젝트에는 Resilience4J, Spring Retry, 스프링 프레임워크 7의 재시도 기능에 기반한 구현이 들어 있고, 설정은 구현마다 문서를 보며 `Customizer` 빈으로 합니다.

(공식 문서) Commons의 서킷 브레이커 문서는 이 프로젝트가 서로 다른 서킷 브레이커 구현에 걸친 추상화로 일관된 API를 주고, 개발자가 앱에 맞는 구현을 고르게 한다고 쓴다. 스타터를 넣으면 `CircuitBreakerFactory` 구현 빈이 자동 생성되고 `run`은 `Supplier`와 폴백 `Function`을 받으며, 폴백은 서킷이 열렸을 때 실행되고 원인 `Throwable`을 받으며 생략도 가능하다. 리액터가 있으면 `ReactiveCircuitBreakerFactory`로 `Mono`나 `Flux`를 감싼다. 설정은 `Customizer` 빈으로 하며 구현별 문서를 보라고 한다. 이 문서의 지원 구현 목록에는 Resilience4J, Sentinel, Spring Retry가 있다.
(공식 문서) Circuit Breaker 프로젝트 문서는 이 프로젝트에 Resilience4J, Spring Retry, Framework Retry 구현이 들어 있고 API 자체는 Commons에 있다고 한다. Framework Retry는 스프링 프레임워크 7의 네이티브 재시도(`RetryTemplate`, `RetryPolicy`) 위에 상태 있는 서킷 브레이커를 얹은 가벼운 구현이며 리액티브는 지원하지 않는다. 읽은 문서들에서 Sentinel 구현의 설정 문서는 확인하지 않았다.
