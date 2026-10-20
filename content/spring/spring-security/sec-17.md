---
slug: "sec-17"
topic: "spring-security"
tier: TRICKY
difficulty: 2
title: "정적 리소스를 열 때 permitAll 대신 web.ignoring()을 쓰면 왜 문제가 될 수 있나요?"
keywords: ["permitAll", "ignoring", "보안 헤더", "AuthorizationFilter", "세션"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html"]
concepts: [filter-chain, web-security]
importance: 1
---
**모범 답변 (30~60초)**
문서는 정적 리소스에 ignoring()보다 permitAll을 권장합니다. ignoring()은 시큐리티 필터 체인을 건너뛰므로 보안 헤더도 붙지 않지만, permitAll은 헤더를 그대로 적용합니다. Spring Security 6부터는 인가 규칙이 필요할 때만 세션을 조회해 성능 부담도 줄었다고 합니다. permitAll과 denyAll은 인증 정보를 세션에서 꺼내지 않는다고 문서가 설명합니다. AuthorizationFilter는 기본적으로 체인 마지막이라 인증·익스플로잇 방어 필터는 인가 대상이 아니고, 스프링 MVC 엔드포인트를 추가할 때 특히 중요합니다. 기본 /logout은 LogoutFilter가 AuthorizationFilter보다 앞에 있어 따로 permitAll이 필요 없고, 직접 만든 로그아웃 엔드포인트는 보통 permitAll이 필요합니다.

(공식 문서) authorizeHttpRequests 페이지와 로그아웃 페이지에 근거한다.
