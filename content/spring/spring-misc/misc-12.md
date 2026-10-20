---
slug: "misc-12"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "컨테이너가 Filter와 Interceptor, `DispatcherServlet`을 어떻게 나누는지 설명해 주세요."
keywords: ["Filter(서블릿) -> DispatcherServlet -> HandlerInterceptor -> Controller"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/architecture.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html", "https://docs.spring.io/spring-boot/reference/web/servlet.html"]
concepts: [filter-chain, mvc-request-flow]
importance: 2
links: [{to: "mvc-08", kind: RELATED}, {to: "mvc-01", kind: RELATED}, {to: "sec-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
요청은 톰캣 같은 서블릿 컨테이너가 받고, 컨테이너가 요청 URI에 맞는 필터들과 서블릿으로 `FilterChain`을 만들어 실행합니다. 필터는 컨테이너가 자기 방식으로 등록해서 스프링 빈을 모르고, Spring Security도 `DelegatingFilterProxy`로 이 자리에 끼어듭니다. 체인 끝의 서블릿이 `DispatcherServlet`이고 여기서부터가 스프링 MVC입니다. 핸들러 매핑으로 컨트롤러를 찾으면 그 앞뒤로 `HandlerInterceptor`의 `preHandle`, `postHandle`, `afterCompletion`이 호출됩니다. 그래서 인증 같은 서블릿 수준 처리는 필터에서, 컨트롤러 단위의 공통 처리는 인터셉터에서 합니다. 공식 문서는 인터셉터를 보안 계층으로 쓰기보다 필터 체인 기반 보안을 권합니다.

(공식 문서) Spring Security 아키텍처 문서는 컨테이너가 요청 URI 경로에 따라 Filter들과 Servlet으로 `FilterChain`을 만들고 Spring MVC에서 그 Servlet이 `DispatcherServlet`이라고 한다. 한 요청을 처리하는 Servlet은 최대 하나이고, Filter는 하위 Filter나 Servlet의 호출을 막거나 요청·응답을 바꿀 수 있다고 한다. 컨테이너는 자기 표준 방식으로 Filter를 등록하며 스프링이 정의한 빈은 알지 못해서 `DelegatingFilterProxy`가 필요하다고 설명한다. Spring MVC 문서는 `DispatcherServlet`을 프론트 컨트롤러 패턴의 중앙 서블릿으로 소개하고, 요청 처리 순서에서 적절한 핸들러를 찾으면 그 핸들러에 연결된 실행 체인(전처리기, 후처리기, 컨트롤러)을 실행한다고 한다. 인터셉터 문서는 모든 `HandlerMapping`이 핸들러 인터셉션을 지원하고, `HandlerInterceptor`가 핸들러 실행 전 `preHandle`(false를 반환하면 나머지 체인과 핸들러를 건너뜀), 실행 후 `postHandle`, 요청 완료 후 `afterCompletion`을 구현할 수 있다고 한다. 또 `@ResponseBody`나 `ResponseEntity` 메서드는 `postHandle` 전에 응답이 이미 커밋되므로 그때 헤더를 바꾸기엔 늦다고 한다. 그리고 인터셉터는 어노테이션 컨트롤러의 경로 매칭과 어긋날 수 있어 보안 계층으로는 이상적이지 않으며, Spring Security나 서블릿 필터 체인에 통합된 방식을 가능한 한 일찍 적용하라고 권한다. Boot 문서는 스프링 빈인 Servlet, Filter가 내장 컨테이너에 등록된다고 한다.
