---
slug: "scl-08"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "Spring Cloud Gateway는 WebFlux 기반과 Web MVC 기반이 있다는데, 무엇이 다르고 어떻게 고르나요?"
keywords: ["WebFlux·Netty 기반 서버", "Web MVC 기반은 서블릿 컨테이너 가능", "WAR 배포 불가", "ProxyExchange 방식", "스타터 이름 변경"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/index.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/starter.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webmvc/starter.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webmvc/how-it-works.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webmvc/gateway-request-predicates.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/request-predicates-factories.html", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.0-Release-Notes"]
concepts: [api-gateway, nonblocking-model]
importance: 1
links: [{to: "scl-03", kind: PREREQ}, {to: "mvc-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
공식 문서는 게이트웨이에 서버와 프록시 익스체인지 두 종류가 있고 각각 WebFlux와 Web MVC를 지원한다고 설명합니다. 서버 WebFlux는 스프링 WebFlux와 리액터 위에 만들어져 Netty 런타임이 필요하며 전통적인 서블릿 컨테이너나 WAR로는 동작하지 않고, 스프링 데이터나 시큐리티 같은 동기 라이브러리 방식도 그대로 적용되지 않을 수 있습니다. 서버 Web MVC는 WebMvc.fn 위에서 톰캣이나 제티 같은 서블릿 런타임에서 돌아갑니다. 2025.0부터 스타터 이름에 `server-webflux`와 `server-webmvc`가 붙고 속성 접두어도 바뀌었습니다.

(공식 문서) 게이트웨이 소개는 서버와 프록시 익스체인지 두 변형이 있고 둘 다 WebFlux와 Web MVC를 제공하며, 서버 변형은 독립 실행이나 부트 앱 임베드가 가능한 완전한 API 게이트웨이이고 프록시 익스체인지는 어노테이션 기반 앱의 핸들러 메서드에서 `ProxyExchange` 파라미터를 쓰는 용도라고 쓴다. WebFlux 서버 문서는 스프링 부트, WebFlux, 리액터 위에 만들어졌고 Netty 런타임이 필요하며 서블릿 컨테이너나 WAR로는 동작하지 않는다고 한다. Web MVC 서버 문서는 스프링 부트와 WebMvc.fn 위에 만들어졌고 톰캣, 제티 같은 서블릿 런타임에서 동작하며 비동기나 리액티브 라이브러리는 맞지 않을 수 있다고 한다. 라우트는 WebMvc.fn `RouterFunction`이다.
(공식 문서) 2025.0 릴리스 노트는 게이트웨이의 새 모듈과 스타터 이름(`spring-cloud-starter-gateway-server-webflux`, `spring-cloud-starter-gateway-server-webmvc` 등)이 두 스타일과 두 웹 스택을 분명히 하려고 만들어졌고 옛 이름은 deprecated라고 쓴다. 속성 접두어도 `spring.cloud.gateway.server.webflux.*`와 `spring.cloud.gateway.server.webmvc.*`로 옮겨졌고 `spring-boot-properties-migrator`로 옛 접두어를 임시 지원할 수 있다고 한다.
(보충) 어느 쪽을 고를지는 기존 스택(서블릿 기반인지 리액티브 기반인지)과 팀의 숙련도에 달린 판단이다. 읽은 게이트웨이 소개·스타터·동작 방식 문서에는 어느 쪽을 권장한다는 문장이 없었다. 프레딕트 문서의 절 목록은 두 변형이 달라서(WebFlux 문서에는 RemoteAddr, XForwardedRemoteAddr, ReadBody 절이 있고 Web MVC 프레딕트 문서에는 없다) 기능이 완전히 같다고 단정할 수 없다. 필터까지 비교하지는 않았다.
