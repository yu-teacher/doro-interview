---
slug: "mvc-02"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "Front Controller 패턴이란 무엇이고 Spring MVC는 어떻게 적용하나요?"
keywords: ["Front Controller", "단일 진입점", "위임", "전략 교체"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/special-bean-types.html"]
concepts: [mvc-request-flow, gof-patterns]
importance: 2
links: [{to: "pat-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
Front Controller는 중앙에 하나의 진입점을 두고, 공유되는 요청 처리 알고리즘은 그곳에서 제공하되 실제 작업은 위임 컴포넌트에 맡기는 패턴입니다. Spring MVC는 이 패턴을 중심으로 설계되었고, 그 중앙 서블릿이 `DispatcherServlet`입니다. 요청 매핑, 뷰 해석, 예외 처리 같은 일은 Spring 설정에서 찾아낸 설정 가능한 위임 컴포넌트, 즉 `HandlerMapping`, `HandlerAdapter`, `ViewResolver`, `HandlerExceptionResolver` 같은 특수 빈이 맡습니다. 이 빈들은 속성을 바꾸거나 확장·교체할 수 있어서, 전략을 바꿔 끼우기 쉽고 다양한 처리 흐름을 지원합니다.

- (공식 문서, DispatcherServlet) Spring MVC는 front controller 패턴을 중심으로 설계되었고, 중앙 서블릿인 DispatcherServlet이 공유 요청 처리 알고리즘을 제공하며 실제 작업은 설정 가능한 위임 컴포넌트가 수행한다. 이 모델은 유연하고 다양한 워크플로를 지원한다. DispatcherServlet도 Servlet이므로 Servlet 스펙에 따라 선언하고 매핑해야 한다. Spring Boot는 서블릿 컨테이너 생명주기에 기대지 않고, Spring 설정에서 Filter와 Servlet 선언을 찾아 컨테이너에 등록한다.
- (공식 문서, Special Bean Types) DispatcherServlet은 프레임워크 계약을 구현한 특수 빈에 위임한다. 이 빈들은 기본 계약을 갖추고 있으며 속성을 커스터마이즈하거나 확장·교체할 수 있다.
