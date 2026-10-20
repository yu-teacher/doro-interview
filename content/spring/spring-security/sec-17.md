---
slug: "sec-17"
topic: "spring-security"
tier: TRICKY
difficulty: 2
title: "정적 리소스를 열 때 permitAll 대신 web.ignoring()을 쓰면 왜 문제가 될 수 있나요?"
keywords: ["permitAll", "ignoring", "보안 헤더", "AuthorizationFilter", "세션"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html"]
---
**모범 답변 (30~60초)**
문서는 정적 리소스에 ignoring()보다 permitAll을 권장합니다. ignoring()은 시큐리티 필터 체인을 건너뛰므로 보안 헤더도 붙지 않지만, permitAll은 헤더를 그대로 적용합니다. 또 Spring Security 6부터는 인가 규칙이 필요로 할 때만 세션을 조회한다는 점도 permitAll을 권장하는 이유로 문서가 듭니다. permitAll과 denyAll은 인증 정보를 아예 꺼내지 않아 더 빠르기도 합니다. 한편 AuthorizationFilter는 체인의 마지막에 있어서 인증 필터나 익스플로잇 방어 필터는 인가 대상이 아니고, 스프링 MVC 엔드포인트는 그 뒤에서 실행되므로 규칙에 포함되어야 열립니다. 기본 /logout은 LogoutFilter가 앞에 있어 permitAll이 필요 없지만 커스텀 로그아웃 엔드포인트는 열어 주어야 합니다.

(공식 문서) authorizeHttpRequests 페이지와 로그아웃 페이지에 근거한다.
