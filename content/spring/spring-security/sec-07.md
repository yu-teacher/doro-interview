---
slug: "sec-07"
topic: "spring-security"
tier: BASIC
difficulty: 1
title: "스프링 시큐리티의 CSRF 보호는 기본적으로 어떻게 동작하나요?"
keywords: ["안전하지 않은 메서드", "동기화 토큰", "CsrfFilter", "HttpSessionCsrfTokenRepository", "InvalidCsrfTokenException"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html"]
---
**모범 답변 (30~60초)**
CSRF 방어는 기본으로 켜져 있고 POST 같은 안전하지 않은 메서드에 적용됩니다. 동기화 토큰 패턴을 쓰는데, 토큰은 브라우저가 자동으로 붙이지 않는 위치, 즉 폼 파라미터나 헤더로 보내야 하므로 쿠키에만 의존할 수 없습니다. CsrfFilter가 CsrfTokenRepository에 저장된 토큰과 요청 값을 비교하며, 기본 저장소는 HttpSessionCsrfTokenRepository라 세션에 저장합니다. 토큰이 없거나 틀리면 InvalidCsrfTokenException이 AccessDeniedException으로 처리됩니다. Thymeleaf 같은 뷰는 폼에 토큰을 자동으로 넣어 주고, 로그인 요청도 위조 방지를 위해 CSRF 검사를 받습니다. 브라우저 트래픽을 처리하지 않는 백엔드는 비활성화를 고려할 수 있다고 문서가 말합니다.

(공식 문서) 서블릿 CSRF 페이지에 근거한다. Spring Security 6부터 토큰은 필요할 때만 로드(deferred)되고 요청마다 무작위화(BREACH 대응)가 기본이라고 한다.
