---
slug: "sec-12"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "ExceptionTranslationFilter는 인증 예외와 접근 거부를 각각 어떻게 처리하나요?"
keywords: ["ExceptionTranslationFilter", "AuthenticationEntryPoint", "AccessDeniedHandler", "RequestCache", "BearerTokenAuthenticationEntryPoint"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/form.html", "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html"]
concepts: [authn-authz, filter-chain]
importance: 2
links: [{to: "sec-03", kind: PREREQ}, {to: "web-02", kind: RELATED}, {to: "mvc-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
ExceptionTranslationFilter는 체인을 try/catch로 감싸 AccessDeniedException과 AuthenticationException을 HTTP 응답으로 바꿉니다. 인증되지 않은 사용자이거나 AuthenticationException이면 SecurityContextHolder를 비우고 RequestCache에 원래 요청을 저장한 뒤 AuthenticationEntryPoint로 자격 증명을 요구합니다. 인증된 사용자의 AccessDeniedException은 AccessDeniedHandler가 처리합니다. 폼 로그인에서는 보통 LoginUrlAuthenticationEntryPoint가 로그인 페이지로 리다이렉트하고, 리소스 서버에서는 BearerTokenAuthenticationEntryPoint가 WWW-Authenticate 헤더를 보냅니다.

(공식 문서) 아키텍처, 폼 로그인, 리소스 서버 개요 페이지에 근거한다. 기본 요청 캐시는 세션에 저장하는 HttpSessionRequestCache다. 기본 AuthenticationEntryPoint와 AccessDeniedHandler 구현은 아키텍처 페이지에서 확인하지 못했다.
