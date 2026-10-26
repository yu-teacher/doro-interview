---
slug: "scl-21"
topic: "spring-cloud"
tier: TRICKY
difficulty: 3
title: "Gateway의 DiscoveryClient 라우트에 필터를 추가했더니 하위 서비스에서 404가 나는 이유는 무엇인가요?"
keywords: ["lb://서비스ID 라우트 자동 생성", "기본 Path 프레딕트 /serviceId/**", "기본 RewritePath 필터", "filters 설정이 기본 목록을 대체", "RewritePath 다시 선언"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/the-discoveryclient-route-definition-locator.html", "https://docs.spring.io/spring-cloud-gateway/reference/appendix.html", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.0-Release-Notes"]
concepts: [api-gateway, service-discovery]
importance: 1
links: [{to: "scl-09", kind: PREREQ}, {to: "scl-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`discovery.locator.enabled=true`로 켜면 `DiscoveryClient`에 등록된 서비스마다 `lb://서비스ID` 라우트가 자동으로 만들어지고, 기본으로 `/서비스ID/**` 경로 프레딕트와 서비스ID 접두어를 떼어 내는 `RewritePath` 필터가 붙습니다. 그런데 `locator.filters`를 설정하면 기본 필터 목록 전체가 대체되기 때문에, 내 필터만 쓰고 `RewritePath`를 다시 선언하지 않으면 서비스ID가 경로에 남은 채 하위 서비스로 가서 404가 납니다. 그래서 커스텀 필터를 넣을 때는 기본 `RewritePath`를 함께 적어야 합니다. 로드 밸런싱을 쓰므로 `spring-cloud-starter-loadbalancer`도 필요합니다.

(공식 문서) DiscoveryClient 라우트 정의 로케이터 문서는 `spring.cloud.gateway.discovery.locator.enabled=true`(2025.0부터 서버 속성 접두어는 `spring.cloud.gateway.server.webflux.*`로 옮겨졌고 속성 부록도 `...server.webflux.discovery.locator.enabled`로 적으므로 현행 키는 이쪽이다)로 켜면 `DiscoveryClient`가 돌려주는 서비스 이름으로 `lb://service-name` 라우트가 만들어지며 로드 밸런서 스타터가 필요하다고 한다. 기본 프레딕트는 `/serviceId/**` 경로 프레딕트이고 기본 필터는 정규식 `/serviceId/?(?<remaining>.*)`를 `/${remaining}`으로 바꾸는 `RewritePath`라서 서비스 ID를 떼어 낸다. `locator.filters`를 설정하면 기본 필터 목록 전체가 대체되므로 `RewritePath`를 다시 선언하지 않으면 서비스 ID가 안 떼어져 하위 서비스에서 404가 난다고 명시하며, 사용자 정의 필터를 넣을 때 항상 기본 `RewritePath`를 포함하라고 안내한다. 실제 게이트웨이를 띄워 재현하지는 않았다.
