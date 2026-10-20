---
slug: "misc-10"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "Spring Security의 기본 동작 흐름(필터 체인)을 개요 수준으로 설명해 주세요."
keywords: ["DelegatingFilterProxy", "FilterChainProxy", "SecurityFilterChain", "AuthorizationFilter", "ExceptionTranslationFilter", "SecurityContext"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html"]
---
**모범 답변 (30~60초)**
Spring Security는 서블릿 필터 기반입니다. 컨테이너는 스프링 빈을 모르기 때문에 등록된 `DelegatingFilterProxy`가 스프링 빈인 `FilterChainProxy`로 위임합니다. `FilterChainProxy`는 요청에 맞는 `SecurityFilterChain`을 하나 골라 그 안의 보안 필터를 순서대로 실행합니다. 예를 들어 CSRF, 인증 필터(Basic, 폼 로그인), 마지막에 인가 필터 `AuthorizationFilter` 순서입니다. 이 필터들은 `DispatcherServlet` 앞에서 동작해 인증, 인가에 실패하면 컨트롤러에 도달하지 못합니다. 인증/인가 예외는 `ExceptionTranslationFilter`가 받아 `AuthenticationEntryPoint`(로그인 유도 등)나 `AccessDeniedHandler`(접근 거부)로 넘깁니다.

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(Customizer.withDefaults())
        .httpBasic(Customizer.withDefaults())
        .authorizeHttpRequests(a -> a.anyRequest().authenticated());
    return http.build();
}
```

(공식 문서) Servlet Architecture 문서에서 확인한 내용이다. 컨테이너가 요청 URI 경로에 따라 Filter들과 하나의 Servlet(Spring MVC에서는 `DispatcherServlet`)으로 `FilterChain`을 만들고, Filter는 하위 Filter나 Servlet의 호출을 막을 수 있다. `DelegatingFilterProxy`는 서블릿 컨테이너의 생명주기와 스프링 `ApplicationContext`를 잇는 Filter 구현으로, 컨테이너가 스프링 빈을 알지 못하는 한계를 넘어 스프링 빈 Filter에 작업을 위임한다. `FilterChainProxy`는 `SecurityFilterChain`을 통해 여러 Filter에 위임하는 Spring Security 제공 Filter이며 빈이라 보통 `DelegatingFilterProxy`에 감싸인다. 요청마다 `FilterChainProxy`가 어느 `SecurityFilterChain`을 쓸지 정하고 처음 매칭되는 체인 하나만 호출된다. `FilterChainProxy`는 메모리 누수를 피하려고 `SecurityContext`를 비우는 일도 한다. 예제 설정(CSRF, Basic, 폼 로그인, 인가)의 필터 순서는 `CsrfFilter`, 인증 필터들, `AuthorizationFilter` 순이며, 위 코드는 이 예제에서 폼 로그인을 뺀 것이다. `ExceptionTranslationFilter`는 `AccessDeniedException`과 `AuthenticationException`을 HTTP 응답으로 번역한다. 인증되지 않았거나 `AuthenticationException`이면 `SecurityContextHolder`를 비우고 요청을 저장한 뒤 `AuthenticationEntryPoint`로 자격 증명을 요청하며(로그인 페이지 리다이렉트나 `WWW-Authenticate` 헤더 전송 등), 그렇지 않고 `AccessDeniedException`이면 `AccessDeniedHandler`를 호출한다.
