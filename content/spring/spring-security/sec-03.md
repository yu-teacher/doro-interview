---
slug: "sec-03"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "DelegatingFilterProxy, FilterChainProxy, SecurityFilterChain은 어떤 관계인가요?"
keywords: ["DelegatingFilterProxy", "FilterChainProxy", "SecurityFilterChain", "첫 번째로 매칭", "HttpFirewall"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/architecture.html"]
concepts: [filter-chain, authn-authz]
importance: 2
links: [{to: "sec-17", kind: FOLLOWUP}, {to: "misc-10", kind: RELATED}, {to: "mvc-08", kind: RELATED}, {to: "misc-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
서블릿 컨테이너는 스프링 빈을 모르기 때문에, 컨테이너에 등록되는 DelegatingFilterProxy가 스프링 빈으로 존재하는 Filter에 요청을 위임하는 다리 역할을 합니다. 그 빈이 FilterChainProxy이고 스프링 시큐리티 서블릿 지원의 시작점입니다. FilterChainProxy는 여러 SecurityFilterChain 중 요청에 맞는 것을 골라 그 체인의 필터를 실행하는데, 체인이 여러 개여도 첫 번째로 매칭되는 하나만 호출됩니다. 또 HttpFirewall로 특정 공격을 막고 요청이 끝나면 SecurityContext를 비웁니다. 체인 선택에는 URL뿐 아니라 요청의 어떤 값이든 쓸 수 있는 RequestMatcher를 사용합니다.

(공식 문서) 아키텍처 페이지에 근거한다. 필터 순서는 FilterOrderRegistration이 관리한다. 필터를 빈으로 선언하면 부트가 컨테이너에도 등록해 두 번 실행될 수 있어, FilterRegistrationBean에서 setEnabled(false)로 막으라고 문서가 안내한다.
