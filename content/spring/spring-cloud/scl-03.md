---
slug: "scl-03"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "Spring Cloud Gateway의 라우트, 프레딕트, 필터는 각각 무엇이고 요청은 어떻게 처리되나요?"
keywords: ["라우트 = ID+URI+프레딕트+필터", "프레딕트로 요청 매칭", "필터로 요청·응답 수정", "pre·post 필터", "횡단 관심사를 앞단에서 처리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/index.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/glossary.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/how-it-works.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/request-predicates-factories.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/configuring-route-predicate-factories-and-filter-factories.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/gatewayfilter-factories/circuitbreaker-filter-factory.html"]
concepts: [api-gateway, filter-chain]
importance: 3
links: [{to: "scl-08", kind: FOLLOWUP}, {to: "scl-09", kind: FOLLOWUP}, {to: "dst-05", kind: RELATED}, {to: "mvc-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
게이트웨이는 요청을 받아 뒤쪽 서비스로 라우팅하면서 보안, 모니터링, 복원력 같은 횡단 관심사를 앞단에서 처리하는 API 게이트웨이입니다. 라우트는 ID, 목적지 URI, 프레딕트 모음, 필터 모음으로 이뤄진 기본 단위이고 프레딕트가 모두 참일 때 매칭됩니다. 프레딕트는 헤더나 경로, 파라미터 같은 요청 속성을 검사하고, 필터는 프록시 요청을 보내기 전과 후에 요청과 응답을 바꿀 수 있습니다. 매칭된 요청은 게이트웨이 웹 핸들러로 가서 필터 체인의 pre 로직, 프록시 호출, post 로직 순서로 처리됩니다.

(공식 문서) 게이트웨이 소개는 스프링 생태계 위의 API 게이트웨이로 API로 라우팅하며 보안, 모니터링과 메트릭, 복원력 같은 횡단 관심사를 제공하는 것이 목표라고 쓴다. 용어집은 라우트를 ID, 목적지 URI, 프레딕트 모음, 필터 모음으로 정의하고 집계 프레딕트가 참이면 매칭된다고 한다. 프레딕트는 `ServerWebExchange`를 입력으로 받는 자바 `Predicate`이고, 필터는 특정 팩토리로 만든 `GatewayFilter` 인스턴스다. 동작 방식 절은 게이트웨이 핸들러 매핑이 라우트와 매칭하면 게이트웨이 웹 핸들러로 보내고, 그 요청 전용 필터 체인이 프록시 요청 전의 pre 로직과 후의 post 로직을 실행한다고 설명한다.
(공식 문서) 내장 프레딕트 팩토리는 모두 HTTP 요청의 서로 다른 속성을 매칭하고 여러 개를 논리 and로 결합할 수 있다. 설정은 YAML의 단축 표기나 풀어 쓴 `name`과 `args` 형태로 하고, 자바 `RouteLocatorBuilder` DSL로도 같은 라우트를 만들 수 있다.
