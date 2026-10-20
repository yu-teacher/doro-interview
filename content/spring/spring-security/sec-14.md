---
slug: "sec-14"
topic: "spring-security"
tier: DEEP
difficulty: 2
title: "스프링 시큐리티가 기본으로 추가하는 보안 응답 헤더에는 무엇이 있나요?"
keywords: ["Cache-Control", "nosniff", "X-Frame-Options", "Strict-Transport-Security", "Content-Security-Policy"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html", "https://docs.spring.io/spring-security/reference/features/exploits/headers.html"]
concepts: [web-security]
importance: 2
links: [{to: "web-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
문서의 기본 헤더 목록은 다섯 가지입니다. Cache-Control은 캐시를 막는 값으로 사용자 콘텐츠를 보호하고, 애플리케이션이 직접 캐시 헤더를 주면 시큐리티는 물러납니다. X-Content-Type-Options는 nosniff로 콘텐츠 스니핑을 막고, X-Frame-Options는 DENY로 iframe 렌더링을 막습니다. Strict-Transport-Security는 HTTPS 요청에서만 추가됩니다. X-XSS-Protection은 0으로 두며 문서는 OWASP 권고가 명시적으로 0을 주는 것이라고 설명합니다. 반면 Content-Security-Policy는 애플리케이션 맥락 없이는 합리적인 기본값을 알 수 없어서 기본으로 추가되지 않고, 직접 정책을 지정해야 합니다. Referrer-Policy와 Permissions-Policy도 기본이 아닙니다.

(공식 문서) 서블릿 헤더 페이지와 features의 보안 응답 헤더 페이지에 근거한다. 문서 값은 Cache-Control이 `no-cache, no-store, max-age=0, must-revalidate`, HSTS가 `max-age=31536000 ; includeSubDomains`다. HSTS 기본값에 preload가 포함되는지는 같은 features 페이지 안에서 기본 헤더 목록(미포함)과 본문 예시(포함)가 엇갈려 확인 불가다.
