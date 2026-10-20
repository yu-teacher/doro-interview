---
slug: "sec-01"
topic: "spring-security"
tier: BASIC
difficulty: 1
title: "스프링 시큐리티에서 인증과 인가는 각각 어떤 컴포넌트가 처리하나요?"
keywords: ["AuthenticationManager", "ProviderManager", "AuthorizationFilter", "AuthorizationManager", "AccessDeniedException"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html"]
---
**모범 답변 (30~60초)**
인증은 AuthenticationManager가 맡고, 보통 구현체인 ProviderManager가 여러 AuthenticationProvider에게 위임합니다. 사용자명과 비밀번호는 DaoAuthenticationProvider, JWT는 JwtAuthenticationProvider가 담당하고, 인증을 호출한 필터가 결과 Authentication을 SecurityContextHolder에 넣습니다. 인가는 AuthorizationFilter가 현재 인증 정보와 요청을 AuthorizationManager에 넘겨 허용 여부를 판단하는 구조입니다. 거부되면 AccessDeniedException이 던져지고 ExceptionTranslationFilter가 응답으로 바꿉니다.

(공식 문서) 인증 쪽은 서블릿 인증 아키텍처 페이지, 인가 쪽은 인가 아키텍처와 authorizeHttpRequests 페이지에 근거한다. AccessDecisionManager 계열은 아직 제거되지 않았고 역사적 참고용으로만 문서에 남아 있다고 한다(제거 시점은 문서에 없다).
