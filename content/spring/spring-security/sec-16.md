---
slug: "sec-16"
topic: "spring-security"
tier: TRICKY
difficulty: 3
title: "CSRF 보호를 끄면 로그아웃 동작은 어떻게 달라지고, 끄기 전에 무엇을 따져야 하나요?"
keywords: ["POST", "확인 페이지", "LogoutFilter", "csrf.disable", "ignoringRequestMatchers"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/logout.html", "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html"]
---
**모범 답변 (30~60초)**
CSRF가 켜져 있으면 LogoutFilter는 POST 요청만 로그아웃으로 처리합니다. GET /logout은 사용자에게 한 번 더 확인시키는 확인 페이지를 보여 주고, 그 페이지가 POST에 필요한 CSRF 토큰을 제공합니다. 반대로 CSRF를 끄면 확인 페이지 없이 바로 로그아웃이 수행된다고 문서가 설명합니다. 그래서 문서는 폼으로 POST하는 것이 가장 쉬운 방법이고 GET 로그아웃은 일반적으로 권장되지 않는다고 합니다. 끄기 전에는 정말 필요한지 따져 보라고 하고, 브라우저 트래픽을 처리하지 않는 백엔드는 끌 수 있다고 하며, 일부 엔드포인트만 필요하면 csrf.disable() 대신 ignoringRequestMatchers로 제외하라고 안내합니다. 세션 만료로 토큰이 사라지는 문제는 쿠키 저장소나 커스텀 AccessDeniedHandler로 대응할 수 있습니다.

(공식 문서) 로그아웃 페이지와 CSRF 페이지에 근거한다. 로그아웃 후 기본 LogoutSuccessHandler는 /login?logout으로 리다이렉트한다. 원문 재확인 결과 두 서술은 충돌하지 않는다. 로그아웃 페이지는 GET /logout에 확인 페이지가 뜬다는 점을, CSRF 페이지는 CSRF가 켜진 기본 상태에서 LogoutFilter가 POST만 처리한다는 점을 말한다.
