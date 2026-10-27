---
slug: "wfx-07"
topic: "spring-webflux"
tier: BASIC
difficulty: 1
title: "WebFlux는 어떤 서버에서 실행되고 Spring Boot는 기본으로 무엇을 쓰나요?"
keywords: ["Netty 기본", "Tomcat·Jetty 선택 가능", "HttpHandler 공통 계약", "서블릿 논블로킹 I/O", "서블릿 API 직접 사용 만류"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://docs.spring.io/spring-framework/reference/web/webflux/reactive-spring.html", "https://docs.spring.io/spring-boot/reference/web/reactive.html"]
concepts: [servlet-container, nonblocking-model]
importance: 1
links: [{to: "boot-10", kind: RELATED}, {to: "mvc-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
WebFlux는 Netty 같은 비서블릿 런타임과 Tomcat, Jetty, 서블릿 컨테이너에서 돌아갑니다. 서버마다 API가 다르기 때문에 `HttpHandler`라는 최소한의 공통 계약을 두고, 서버별 어댑터가 이를 각 서버에 연결하며 그 위에 프로그래밍 모델을 올립니다. Spring Boot의 WebFlux 스타터는 기본으로 Netty를 쓰고, 의존성만 바꾸면 Tomcat이나 Jetty로 바꿀 수 있습니다. Spring 문서는 Netty가 비동기 논블로킹 영역에서 더 널리 쓰이고 클라이언트와 서버가 자원을 공유할 수 있기 때문이라고 설명합니다. Tomcat이나 Jetty에서도 WebFlux는 서블릿 논블로킹 I/O를 쓰며, 서블릿 필터나 서블릿 API 직접 조작은 강하게 말립니다.

(공식 문서, WebFlux 개요 Servers) Tomcat, Jetty, 서블릿 컨테이너와 Netty 같은 비서블릿 런타임을 지원하고 모두 낮은 수준의 공통 API로 맞춘다. Boot 스타터는 기본으로 Netty이고, 이유는 비동기 논블로킹 영역에서 더 널리 쓰이고 클라이언트와 서버가 자원을 공유하게 해 준다는 것이라고 쓴다. Tomcat, Jetty는 MVC와 WebFlux 모두에서 쓸 수 있지만 쓰는 방식이 매우 다르다: MVC는 서블릿 블로킹 I/O를 쓰고 서블릿 API를 직접 쓰게 하는 반면, WebFlux는 서블릿 논블로킹 I/O를 낮은 수준 어댑터 뒤에서 쓰며 직접 노출하지 않는다. 서블릿 필터를 매핑하거나 서블릿 API를 직접 다루는 것을 강하게 만류하고, 블로킹 I/O와 논블로킹 I/O를 같은 컨텍스트에서 섞으면 런타임 문제가 생긴다고 한다.
(공식 문서, Reactive Core) `HttpHandler`는 요청과 응답을 처리하는 한 개 메서드의 최소 계약으로, 다양한 HTTP 서버 API 위의 최소 추상화가 유일한 목적이다. Reactor Netty, Tomcat, Jetty, 서블릿 컨테이너용 어댑터를 표로 제시한다.
(공식 문서, Spring Boot) 임베디드 리액티브 웹 서버로 Reactor Netty, Tomcat, Jetty를 지원하며, 대부분의 개발자는 해당 스타터로 구성된 인스턴스를 얻는다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
