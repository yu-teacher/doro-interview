---
slug: "scl-19"
topic: "spring-cloud"
tier: TRICKY
difficulty: 3
title: "Resilience4j 서킷 브레이커를 기본 설정으로 쓰면 실패가 계속돼도 열리지 않는 것처럼 보이는데 왜 그런가요?"
keywords: ["minimumNumberOfCalls 기본 100", "슬라이딩 윈도 크기 100", "실패율 임계값 50%", "최소 호출 수 전에는 계산 안 함", "모든 예외가 실패로 기록"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://resilience4j.readme.io/docs/circuitbreaker", "https://docs.spring.io/spring-cloud-circuitbreaker/reference/spring-cloud-circuitbreaker-resilience4j/default-configuration.html"]
concepts: [resilience]
importance: 1
links: [{to: "scl-07", kind: PREREQ}, {to: "scl-13", kind: PREREQ}, {to: "dst-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
Resilience4j 라이브러리 기본값은 슬라이딩 윈도 크기와 최소 호출 수가 모두 100이라서, 최소 호출 수만큼 기록되기 전에는 실패율을 계산하지 않기 때문입니다. 실패율 임계값은 50%지만 호출이 99번뿐이면 전부 실패해도 열리지 않으므로, 트래픽이 적은 서비스에서는 `minimumNumberOfCalls`와 `slidingWindowSize`를 낮춰야 합니다. 또 기본으로는 모든 예외를 실패로 기록하므로 실패로 치고 싶지 않은 예외는 `ignoreExceptions`로 제외합니다. 열린 뒤에는 `waitDurationInOpenState` 기본 60초가 지나야 반열림이 되고, 기본 설정에서는 그 전환도 호출이 와야 일어납니다.

(공식 문서) Resilience4j CircuitBreaker 문서의 설정 표는 `failureRateThreshold` 50, `slidingWindowType` `COUNT_BASED`, `slidingWindowSize` 100, `minimumNumberOfCalls` 100, `waitDurationInOpenState` 60000ms, `permittedNumberOfCallsInHalfOpenState` 10, `slowCallRateThreshold` 100, `automaticTransitionFromOpenToHalfOpenEnabled` false가 기본이라고 보여 준다. 실패율과 느린 호출 비율은 최소 호출 수가 기록돼야만 계산되며, 예를 들어 최소가 10이면 9번 평가에서는 전부 실패해도 열리지 않는다고 설명한다. 기본으로 모든 예외가 실패로 기록되고, `recordExceptions`를 지정하면 나머지는 성공으로 보며 `ignoreExceptions`는 실패도 성공도 아니게 제외한다. 자동 전환이 꺼져 있으면 `HALF_OPEN` 전환은 대기 시간이 지난 뒤 호출이 있어야 일어난다.
(공식 문서) 스프링 클라우드 서킷 브레이커의 기본 설정 예시는 `CircuitBreakerConfig.ofDefaults()`와 타임리미터를 `Resilience4JConfigBuilder`에 넘긴다. 스프링 클라우드 팩토리가 설정 없이 만든 서킷의 내장 기본값이 이것과 같은지는 읽은 문서에 명시되지 않아 확인하지 못했고, 실행해 보지도 않았다. 위 기본값은 Resilience4j 라이브러리 설정 표 기준이다.
