---
slug: "misc-10"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "Spring Security의 기본 동작 흐름(필터 체인)을 개요 수준으로 설명해 주세요."
keywords: ["DelegatingFilterProxy", "FilterChainProxy", "SecurityFilterChain", "AuthorizationFilter", "ExceptionTranslationFilter", "SecurityContext"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
Spring Security는 서블릿 필터 기반입니다. 서블릿 컨테이너는 스프링 빈을 모르기 때문에 컨테이너에 등록된 `DelegatingFilterProxy`가 스프링 빈으로 위임하고, 그 빈이 `FilterChainProxy`입니다. `FilterChainProxy`가 요청에 맞는 `SecurityFilterChain`을 하나 골라 그 안의 보안 필터들을 순서대로 실행합니다. 예를 들어 CSRF 필터, 인증 필터(Basic, 폼 로그인), 마지막에 인가 필터인 `AuthorizationFilter` 순서입니다. 이 필터들이 `DispatcherServlet`보다 앞에서 동작하기 때문에 인증, 인가에 실패하면 컨트롤러에 도달하지 못합니다. 인증/인가 예외는 `ExceptionTranslationFilter`가 받아서 401/403 응답이나 로그인 진입으로 바꿔 줍니다.

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(Customizer.withDefaults())
        .httpBasic(Customizer.withDefaults())
        .authorizeHttpRequests(a -> a.anyRequest().authenticated());
    return http.build();
}
```

(공식) 위 구조와 필터 순서는 Spring Security Servlet Architecture 문서에서 확인했다. 요청에는 첫 번째로 매칭되는 `SecurityFilterChain`만 적용된다.
