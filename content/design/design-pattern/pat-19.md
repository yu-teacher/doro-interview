---
slug: "pat-19"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "서블릿 필터 체인과 스프링 시큐리티 필터 체인은 책임 연쇄 패턴과 어떤 관계인가요?"
keywords: ["다음 필터에 위임", "chain.doFilter", "체인 중단 가능", "순서가 중요", "FilterChainProxy"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/command.html", "https://docs.spring.io/spring-security/reference/servlet/architecture.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html"]
---
**모범 답변 (30~60초)**
책임 연쇄는 요청을 받은 객체가 직접 처리하거나 하위의 다음 객체에 넘기는 구조이고, Nystrom이 이 모양을 그렇게 부릅니다. 서블릿 필터 체인이 이와 닮은 구조입니다. 컨테이너가 필터들과 서블릿으로 `FilterChain`을 만들고, 각 필터는 `chain.doFilter`로 나머지를 호출하거나, 호출하지 않고 응답을 직접 써서 체인을 끊을 수 있습니다. 호출 전후에 코드를 둘 수 있고 필터는 자기 뒤쪽에만 영향을 주므로 순서가 매우 중요합니다. 스프링 시큐리티는 `FilterChainProxy`가 요청에 맞는 `SecurityFilterChain`을 골라 그 필터들을 실행하며, 여러 체인이 있으면 처음 일치하는 하나만 쓰입니다.

```java
Filter logging = (r, c) -> { log.add("log-before"); c.next(r); log.add("log-after"); };
Filter auth = (r, c) -> { if (r.equals("anon")) { log.add("auth-reject"); return; } log.add("auth-ok"); c.next(r); };
// [logging, auth] + "user" -> [log-before, auth-ok, servlet, log-after]
// [logging, auth] + "anon" -> [log-before, auth-reject, log-after]
// [auth, logging] + "anon" -> [auth-reject]
```

(원저자 자료) Nystrom, "Command" 장: 객체가 명령에 직접 응답하거나 하위 객체에 넘길 수 있는 계층 구조에서는 Chain of Responsibility 패턴이 된다고 짧게 언급한다.
(공식 문서) Spring Security Servlet Architecture 페이지: 컨테이너가 요청 URI 경로에 따라 `Filter`들과 서블릿을 담은 `FilterChain`을 만들고, 스프링 MVC에서는 그 서블릿이 `DispatcherServlet`이다. 필터는 하위 필터나 서블릿의 호출을 막을 수 있고(이때 보통 응답을 직접 씀) 요청·응답을 바꿀 수 있으며, 필터는 하위에만 영향을 주므로 순서가 매우 중요하다고 한다. `FilterChainProxy`는 `SecurityFilterChain`에 위임하고 `RequestMatcher`로 요청의 어떤 속성으로도 체인을 고를 수 있으며, 여러 체인 중 처음 일치하는 것만 호출된다고 한다. `HandlerInterceptor` API 문서는 핸들러 실행 전에 공통 전처리를 넣기 위한 맞춤 핸들러 실행 체인을 위한 워크플로 인터페이스라고 한다.
(실험 확인) 위 코드의 직접 만든 미니 체인(스프링·서블릿 컨테이너 아님)으로 호출 순서와 중단, 순서 변경의 효과를 확인했다.
(보충) 스프링 문서는 필터 체인을 책임 연쇄 패턴이라고 직접 부르지 않는다. 대응은 Nystrom의 설명에 비추어 본 해석이다.
