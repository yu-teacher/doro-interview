---
slug: "scl-06"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "Spring Cloud LoadBalancer는 무엇이고, `@LoadBalanced`는 어떻게 동작하나요?"
keywords: ["클라이언트 측 로드 밸런싱", "서비스 이름을 가상 호스트로", "라운드 로빈 기본", "인스턴스 목록 캐시", "BlockingLoadBalancerClient"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html", "https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/common-abstractions.html"]
concepts: [service-discovery]
importance: 2
links: [{to: "scl-05", kind: PREREQ}, {to: "scl-20", kind: FOLLOWUP}, {to: "dst-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
스프링 클라우드가 자체로 제공하는 클라이언트 측 로드 밸런서입니다. 호출하는 쪽이 `DiscoveryClient` 같은 곳에서 받은 인스턴스 목록에서 하나를 고르며, 기본 알고리즘은 라운드 로빈이고 랜덤으로 바꿀 수도 있습니다. `RestTemplate`이나 `RestClient.Builder` 빈에 `@LoadBalanced`를 붙이면 `http://stores/stores`처럼 호스트 자리에 서비스 이름을 쓴 URI를 `BlockingLoadBalancerClient`가 실제 주소로 바꿔 줍니다. 인스턴스 목록은 기본 35초 TTL로 캐시되고 재시도는 기본으로 꺼져 있으며, 쓰려면 `spring-cloud-starter-loadbalancer` 의존성이 필요합니다.

(공식 문서) LoadBalancer 문서는 스프링 클라우드가 자체 클라이언트 측 로드 밸런서 추상화와 구현을 제공하고, `ReactiveLoadBalancer`의 라운드 로빈과 랜덤 구현이 있으며 서비스 디스커버리 기반 `ServiceInstanceListSupplier`가 인스턴스를 가져온다고 쓴다. 기본은 `RoundRobinLoadBalancer`이고 `@LoadBalancerClient` 설정으로 바꾼다. 서비스 ID마다 별도 자식 컨텍스트가 만들어지고 기본은 지연 초기화다. 캐시는 기본 TTL 35초, 초기 용량 256이며 캐시를 쓰지 않는 구현은 프로토타입용이라 운영에서는 캐시 사용을 권장한다고 한다.
(공식 문서) Commons 공통 추상화 문서는 `@LoadBalanced`를 붙인 `RestTemplate` 빈이 서비스 이름을 가상 호스트명으로 쓰는 URI를 받고, `BlockingLoadBalancerClient`가 전체 물리 주소를 만든다고 설명한다. `RestTemplate`은 더 이상 자동 구성으로 만들어지지 않으며 `RestClient.Builder`와 `WebClient.Builder`에도 같은 방식이 있다. `RestTemplate` 재시도는 기본으로 비활성이고 스프링 리트라이를 클래스패스에 두거나(리액티브는 `spring.cloud.loadbalancer.retry.enabled=true`) 켜야 한다.
