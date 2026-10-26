---
slug: "scl-13"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "Spring Cloud Circuit Breaker에서 Resilience4j 설정은 어떻게 하고, 타임리미터와 벌크헤드는 어떻게 적용되나요?"
keywords: ["Customizer<Resilience4JCircuitBreakerFactory>", "configureDefault와 configure(id)", "프로퍼티 설정 우선순위", "TimeLimiter 기본 활성", "FixedThreadPoolBulkhead 기본"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j/default-configuration.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j/specific-circuit-breaker-configuration.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j/circuit-breaker-properties-configuration.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j/bulkhead-pattern-supporting.html", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j/starters.html"]
concepts: [resilience]
importance: 2
links: [{to: "scl-07", kind: PREREQ}, {to: "scl-19", kind: FOLLOWUP}, {to: "dst-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
자바 설정은 `Customizer<Resilience4JCircuitBreakerFactory>` 빈에서 `configureDefault`로 전체 기본값을, `configure(..., "slow")`로 특정 서킷 하나를 정합니다. 프로퍼티로는 `resilience4j.circuitbreaker`와 `resilience4j.timelimiter` 아래 `configs`와 `instances`를 쓰고, 프로퍼티 설정이 자바 `Customizer` 설정보다 우선하며 메서드 id, 그룹, 전역 기본 순으로 적용됩니다. 타임리미터는 기본으로 켜져 모든 실행에 제한 시간이 걸리고 `disable-time-limiter`로 끌 수 있습니다. `resilience4j-bulkhead`가 클래스패스에 있으면 모든 메서드가 벌크헤드로 감싸지며 기본은 고정 스레드풀 방식입니다.

(공식 문서) Circuit Breaker의 Resilience4J 문서는 기본 설정을 `configureDefault`로(`Resilience4JConfigBuilder`에 `TimeLimiterConfig`와 `CircuitBreakerConfig`를 넘김), 특정 서킷을 `configure(builder, id)`로 정하는 예를 보여 주고, 생성 후 이벤트 핸들러를 붙이는 `addCircuitBreakerCustomizer`와 보안 컨텍스트 전파를 위한 `DelegatingSecurityContextExecutorService` 설정도 설명한다. 스타터는 블로킹용 `spring-cloud-starter-circuitbreaker-resilience4j`와 리액티브용 `...-reactor-resilience4j` 두 가지다.
(공식 문서) 프로퍼티 문서는 `CircuitBreaker`와 `TimeLimiter`의 `configs`나 `instances`를 설정 파일에 둘 수 있고 프로퍼티 설정이 자바 `Customizer`보다 우선하며, 우선순위는 메서드(id), 서비스(그룹), 전역 기본 순이라고 쓴다. 타임리미터는 기본으로 켜져 있어 모든 실행에 명시한 값이나 `TimeLimiterConfig.ofDefaults`의 제한 시간이 걸리고, `spring.cloud.circuitbreaker.resilience4j.disable-time-limiter`로 전역에서, `disable-time-limiter-map`으로 그룹과 인스턴스별로 끌 수 있다. 읽은 Spring Cloud Circuit Breaker 문서들에는 `ofDefaults`의 구체적인 제한 시간 값이 적혀 있지 않았다.
(공식 문서) 벌크헤드 문서는 `resilience4j-bulkhead`가 클래스패스에 있으면 스프링 클라우드 서킷 브레이커가 모든 메서드를 Resilience4j `Bulkhead`로 감싸고 `spring.cloud.circuitbreaker.bulkhead.resilience4j.enabled=false`로 끌 수 있다고 한다. 구현은 세마포어 방식 `SemaphoreBulkhead`와 제한된 큐와 고정 스레드풀의 `FixedThreadPoolBulkhead` 두 가지이고 기본은 후자이며, `enableSemaphoreDefaultBulkhead=true`로 세마포어로 바꾼다. 리액티브는 세마포어 방식만 쓴다.
