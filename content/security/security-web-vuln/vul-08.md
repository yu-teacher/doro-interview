---
slug: "vul-08"
topic: "security-web-vuln"
tier: DEEP
difficulty: 2
title: "CSRF는 어떻게 막나요? Spring Security는 기본으로 어떻게 동작하나요?"
keywords: ["동기화 토큰 패턴", "브라우저가 자동으로 붙이지 않는 위치에 토큰", "서명된 더블 서브밋 쿠키", "SameSite와 Origin 검증은 보조", "안전하지 않은 메서드 기본 보호"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", "https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html"]
concepts: [csrf, web-security]
importance: 3
links: [{to: "vul-18", kind: FOLLOWUP}, {to: "vul-05", kind: PREREQ}, {to: "sec-07", kind: RELATED}, {to: "sec-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
OWASP가 가장 널리 쓰이고 권장되는 방법 중 하나로 꼽는 것은 동기화 토큰 패턴입니다. 서버가 세션마다 예측할 수 없는 토큰을 만들어 세션에 두고, 상태를 바꾸는 요청마다 폼 필드나 헤더처럼 브라우저가 자동으로 붙이지 않는 위치로 토큰을 받아 비교합니다. 서버에 상태를 두기 어려우면 세션에 묶인 HMAC을 쓰는 서명된 더블 서브밋 쿠키를 OWASP가 권장하고, SameSite 쿠키와 Origin 검증은 보조 계층으로 둡니다. Spring Security는 POST 같은 안전하지 않은 HTTP 메서드에 대해 CSRF 보호를 기본으로 켜 두고, 토큰을 기본으로는 `HttpSession`에 저장합니다.

```
같은 세션의 토큰    : true
다른 세션의 토큰    : false
토큰 없음           : false
토큰 변조           : false
```

(원저자 자료) OWASP CSRF Prevention Cheat Sheet는 프레임워크의 내장 보호를 먼저 쓰고, 없으면 상태 변경 요청에 서버가 만든 토큰을 붙여 검증하라고 한다. 상태가 있는 소프트웨어는 동기화 토큰 패턴, 상태가 없는 소프트웨어는 더블 서브밋 쿠키를 권하되 단순한 방식은 비권장이고 세션에 묶은 HMAC을 쓰는 서명 방식을 권장한다. 토큰은 쿠키가 아니라 폼 필드나 커스텀 헤더로 전달하고 URL이나 로그에 노출하지 말라고 한다. 시트는 XSS가 모든 CSRF 완화를 무력화할 수 있다고 경고하고, SameSite와 Origin·Referer 검증은 방어 심층 수단으로 다루며 상태 변경에 GET을 쓰지 말라고 한다. 최신 브라우저만 대상이면 `Sec-Fetch-Site` 같은 Fetch Metadata 헤더를 원본 검증 폴백과 함께 쓸 수 있다고도 한다.
(공식 문서) Spring Security 문서는 안전하지 않은 HTTP 메서드(예: POST)에 대해 기본으로 CSRF 공격을 막는다고 하고, 기본 저장소는 `HttpSessionCsrfTokenRepository`이며 `CookieCsrfTokenRepository`는 `XSRF-TOKEN` 쿠키에 쓰고 `X-XSRF-TOKEN` 헤더나 `_csrf` 파라미터로 읽는다고 한다. 토큰은 브라우저가 자동으로 붙이지 않는 요청 부분(폼 파라미터, 헤더 등)에 넣어야 한다고 설명한다.
(실험 확인) JDK 25 `java Csrf.java`로 세션 ID와 난수에 HMAC-SHA-256을 걸고 상수 시간 비교(`MessageDigest.isEqual`)로 검증하는 토이 구현을 실행한 결과가 위 블록이다. Spring Security의 실제 구현을 실행한 것은 아니다.
