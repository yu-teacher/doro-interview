---
slug: "aut-14"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "인증 토큰은 쿠키와 localStorage 중 어디에 저장해야 하나요?"
keywords: ["localStorage는 XSS로 읽힘", "HttpOnly 쿠키는 스크립트 접근 차단", "쿠키는 CSRF 대비 필요", "SameSite와 CSRF 토큰", "BFF 패턴"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", "https://www.rfc-editor.org/rfc/rfc6265.html"]
concepts: [session-token-auth, cookie, xss]
importance: 2
links: [{to: "vul-03", kind: RELATED}, {to: "vul-05", kind: RELATED}, {to: "web-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
둘 다 완벽하지 않고 막아 주는 위협이 다릅니다. localStorage는 같은 출처의 어떤 자바스크립트든 읽을 수 있어서 XSS 한 번으로 토큰이 통째로 새므로, OWASP는 인증 토큰을 거기에 두지 말라고 권고합니다. HttpOnly 쿠키는 스크립트가 읽을 수 없어 탈취에 강하지만, 브라우저가 쿠키를 자동으로 보내므로 CSRF 대비로 SameSite와 CSRF 토큰이 필요합니다. OWASP는 XSS와 CSRF가 결합하면 요청에 쿠키가 실려 가므로 HttpOnly는 쿠키의 기밀성만 지켜 준다고 설명합니다. 그래서 HttpOnly, Secure, SameSite를 건 쿠키나 서버가 토큰을 쥐는 BFF 구조를 권고합니다.

```
Set-Cookie: __Host-SessionID=<value>; Secure; HttpOnly; SameSite=Strict; Path=/
```

(원저자 자료) OWASP Session Management Cheat Sheet는 localStorage와 sessionStorage가 해당 출처에서 실행되는 모든 자바스크립트에 접근 가능해 XSS 한 번으로 모든 토큰이 노출되므로 세션 ID, JWT, 리프레시 토큰을 거기에 저장하지 말고 HttpOnly·Secure·SameSite 쿠키나 BFF를 쓰라고 권고한다(위 코드 줄은 이 문서가 권장하는 쿠키 형식의 예시다). HttpOnly는 스크립트의 쿠키 접근을 막지만 XSS 공격이 CSRF와 결합하면 요청에는 쿠키가 실려 가고 HttpOnly는 쿠키의 기밀성만 지켜 준다고 하며, SameSite는 CSRF 토큰의 대체가 아니라 CSRF에 대한 심층 방어로 취급하라고 한다.
(공식 문서) RFC 6265 4.1.2.6은 HttpOnly 속성이 쿠키의 범위를 HTTP 요청으로 제한해, 스크립트에 쿠키를 노출하는 비HTTP API에는 쿠키를 제공하지 않게 한다고 정의한다.
