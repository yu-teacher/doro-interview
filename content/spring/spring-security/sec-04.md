---
slug: "sec-04"
topic: "spring-security"
tier: BASIC
difficulty: 1
title: "UserDetailsService와 DaoAuthenticationProvider는 어떻게 함께 동작하나요?"
keywords: ["UserDetailsService", "DaoAuthenticationProvider", "PasswordEncoder", "UserDetails", "FACTOR_PASSWORD"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/user-details-service.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/dao-authentication-provider.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html"]
---
**모범 답변 (30~60초)**
UserDetailsService는 사용자명으로 비밀번호와 기타 속성을 조회하는 인터페이스이고, DaoAuthenticationProvider가 이것을 사용합니다. 필터가 UsernamePasswordAuthenticationToken을 ProviderManager에 넘기면 DaoAuthenticationProvider가 UserDetailsService에서 UserDetails를 가져와 PasswordEncoder로 비밀번호를 검증합니다. 성공하면 principal이 UserDetails인 토큰을 돌려주고, 7.1.1 문서 기준으로 권한에 최소한 FACTOR_PASSWORD가 들어 있습니다. 직접 만든 구현은 빈으로 노출하면 되는데, 문서에 따르면 AuthenticationManagerBuilder를 채우지 않고 AuthenticationProvider 빈도 없을 때만 쓰입니다.

(공식 문서) UserDetailsService 페이지와 DaoAuthenticationProvider 페이지에 근거한다. 문서는 기본 제공 구현으로 인메모리, JDBC, 캐싱 구현이 있다고만 언급한다. 인증 실패 시 예외는 문서에서 설명하지 않는다.
