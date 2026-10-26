---
slug: "scl-09"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "Spring Cloud Gateway에서 전역 필터와 라우트 필터는 어떤 순서로 실행되고, `lb://` URI는 어떻게 처리되나요?"
keywords: ["GlobalFilter와 GatewayFilter 한 체인", "Ordered로 정렬", "pre는 높은 우선순위 먼저·post는 반대", "ReactiveLoadBalancerClientFilter", "인스턴스 없으면 503"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/global-filters.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/how-it-works.html", "https://docs.spring.io/spring-cloud-gateway/reference/appendix.html", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.0-Release-Notes"]
concepts: [api-gateway, filter-chain]
importance: 1
links: [{to: "scl-03", kind: PREREQ}, {to: "scl-21", kind: FOLLOWUP}, {to: "scl-22", kind: FOLLOWUP}, {to: "mvc-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
요청이 라우트에 매칭되면 모든 `GlobalFilter`와 그 라우트의 `GatewayFilter`가 하나의 체인으로 합쳐지고 `Ordered` 값으로 정렬됩니다. 우선순위가 가장 높은 필터가 pre 단계에서는 가장 먼저, post 단계에서는 가장 나중에 실행됩니다. 라우트 URI가 `lb://myservice` 같은 형태면 `ReactiveLoadBalancerClientFilter`가 스프링 클라우드 로드 밸런서로 서비스 이름을 실제 호스트와 포트로 바꿔 요청 URL을 덮어쓰고, 원래 URL은 속성 목록에 보관합니다. 서비스 인스턴스를 찾지 못하면 기본 응답은 503이고, `use404` 속성을 true로 두면 404로 바꿀 수 있습니다.

(공식 문서) 전역 필터 문서는 `GlobalFilter`가 `GatewayFilter`와 같은 시그니처이고 모든 라우트에 조건부로 적용되는 특수 필터라고 설명한다. 요청이 라우트에 매칭되면 필터링 웹 핸들러가 모든 `GlobalFilter` 인스턴스와 라우트별 `GatewayFilter` 인스턴스를 체인에 넣고, 합쳐진 체인을 `org.springframework.core.Ordered`로 정렬한다. pre와 post 단계를 구분하므로 가장 높은 우선순위의 필터가 pre에서 첫째, post에서 마지막이라고 한다.
(공식 문서) 같은 문서의 `ReactiveLoadBalancerClientFilter` 절은 요청 URL 속성의 URI가 `lb` 스킴이면 `ReactorLoadBalancer`로 서비스 이름을 실제 호스트와 포트로 해석해 같은 속성에 넣고, 원래 URL은 원본 URL 속성 목록에 추가한다고 쓴다. 인스턴스를 찾지 못하면 기본은 503이고, 문서는 `spring.cloud.gateway.loadbalancer.use404=true`로 404를 돌려줄 수 있다고 쓴다. 다만 2025.0부터 서버 속성 접두어가 `spring.cloud.gateway.server.webflux.*`로 옮겨졌고, 속성 부록은 `spring.cloud.gateway.server.webflux.loadbalancer.use404`로 적으니 현행 키는 이쪽이다. 반환된 `ServiceInstance`의 `isSecure` 값이 요청 스킴을 덮어쓸 수 있다고도 한다.
