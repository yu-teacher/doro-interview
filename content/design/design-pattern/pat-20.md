---
slug: "pat-20"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "프론트 컨트롤러 패턴은 무엇이고, `DispatcherServlet`은 어떻게 이를 구현하나요?"
keywords: ["모든 요청의 단일 진입점", "공통 처리를 한곳에 집중", "핸들러에 위임", "HandlerMapping", "HandlerAdapter"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/eaaCatalog/frontController.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/special-bean-types.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html"]
concepts: [mvc-request-flow, gof-patterns]
importance: 3
links: [{to: "pat-19", kind: FOLLOWUP}, {to: "mvc-02", kind: RELATED}, {to: "mvc-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
프론트 컨트롤러는 웹 사이트의 모든 요청을 하나의 핸들러 객체를 거치게 하는 컨트롤러입니다. Fowler는 보안, 국제화 같은 공통 처리가 여러 객체에 흩어져 중복되는 문제를 막고, 이 객체가 공통 동작을 수행한 뒤 요청별 동작은 명령 객체에 넘긴다고 설명합니다. 스프링 문서는 Spring MVC가 이 패턴을 중심으로 설계되었고, `DispatcherServlet`이 요청 처리의 공유 알고리즘을 제공하는 동안 실제 작업은 설정 가능한 위임 컴포넌트가 한다고 합니다. 요청 매핑은 `HandlerMapping`, 핸들러 호출은 `HandlerAdapter`, 뷰 결정은 `ViewResolver`가 맡습니다.

(원저자 자료) Fowler, Patterns of Enterprise Application Architecture 카탈로그의 "Front Controller" 항목: 복잡한 웹 사이트에서 보안·국제화·사용자별 뷰 제공 같은 반복 작업이 입력 컨트롤러 여러 곳에 흩어지면 중복되고 런타임 변경이 어렵다고 설명한다. 해법으로 모든 요청을 하나의 핸들러 객체로 모아 공통 동작을 수행하게 하고(데코레이터로 런타임에 바꿀 수 있음), 요청에 고유한 동작은 명령 객체에 위임한다고 한다. 항목은 이 책의 14장을 참조하라고 안내하지만 책 본문은 읽지 못했고 위 항목의 요약 설명에 근거한다.
(공식 문서) DispatcherServlet 페이지는 Spring MVC가 중앙 서블릿이 요청 처리의 공유 알고리즘을 제공하고 실제 작업은 설정 가능한 위임 컴포넌트가 수행하는 프론트 컨트롤러 패턴으로 설계되었다고 직접 말한다. Special Bean Types 페이지는 `HandlerMapping`(요청을 핸들러와 인터셉터 목록에 매핑), `HandlerAdapter`(핸들러 호출 세부를 가림), `HandlerExceptionResolver`, `ViewResolver` 등의 역할을 표로 정리하고, Processing 페이지는 핸들러를 찾아 실행 체인을 실행하고 모델이 있으면 뷰를 렌더링하는 처리 순서를 설명한다. `DispatcherServlet` API 문서는 HTTP 요청 핸들러를 위한 중앙 디스패처라고 한다.
