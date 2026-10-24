---
slug: "vul-06"
topic: "security-web-vuln"
tier: BASIC
difficulty: 2
title: "세션 쿠키의 Secure, HttpOnly, SameSite 속성은 각각 무엇을 막나요?"
keywords: ["Secure는 HTTPS에서만 전송", "HttpOnly는 스크립트 접근 차단", "SameSite는 교차 사이트 전송 제한", "속성마다 막는 대상이 다름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6265.html", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"]
concepts: [cookie, web-security]
importance: 3
links: [{to: "web-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
Secure는 쿠키를 HTTPS 같은 보안 채널로만 보내게 해서 네트워크에서 가로채이는 것을 막습니다. HttpOnly는 `document.cookie` 같은 스크립트용 API에서 쿠키를 숨겨서, XSS가 있어도 세션 ID를 읽어 가기 어렵게 합니다. SameSite는 교차 사이트 요청에 쿠키를 보낼지 정하는 속성이고, Strict는 교차 사이트 요청에서 쿠키를 빼며 Lax는 링크 이동처럼 안전한 메서드의 최상위 이동에만 보냅니다. 세 속성은 막는 대상이 서로 달라서 함께 씁니다. 다만 HttpOnly가 XSS 자체를 막는 것은 아니고, SameSite도 CSRF 토큰을 완전히 대체하지는 못합니다.

```
Set-Cookie: __Host-SID=abc123; HttpOnly; Path=/; SameSite=Lax; Secure
```

(공식 문서) RFC 6265 4.1.2.5절은 Secure가 쿠키를 보안 채널로 전송되는 요청에만 포함시키게 하지만, 보호하는 것은 기밀성뿐이라고 한다. 능동적 네트워크 공격자는 비보안 채널에서 Secure 쿠키를 덮어써 무결성을 해칠 수 있다고 하며 8.6절을 가리키고, 8.6절은 그런 공격자가 http 응답을 가장해 `Set-Cookie`를 주입할 수 있다고 설명한다. 4.1.2.6절은 HttpOnly가 스크립트에 쿠키를 노출하는 비HTTP API에서 쿠키를 빼게 하며 Secure와 독립적이라고 한다. RFC 6265에는 SameSite가 없다.
(원저자 자료) OWASP Session Management Cheat Sheet는 HttpOnly가 세션 ID 탈취를 막기 위해 필수라고 하면서도 XSS와 CSRF가 결합되면 요청에 쿠키가 자동으로 붙는다고 한다. SameSite는 교차 사이트 요청에 쿠키를 보낼지 정하며 Strict는 교차 사이트 요청을 제외하고 Lax는 안전한 메서드를 쓰는 최상위 교차 사이트 이동을 허용한다고 설명한다. 이 시트는 SameSite를 CSRF 토큰의 대체가 아니라 방어 심층으로 다루라고 하고, 브라우저 기본값에 기대지 말고 명시하라고 권고한다. 세션 ID에는 `__Host-` 접두사(Secure, Domain 없음, `Path=/`)를 권고한다.
(실험 확인) Python 3.14 `http.cookies`로 속성을 지정해 출력한 결과가 위 블록이다. 속성의 효과를 브라우저에서 확인한 것은 아니며, 효과는 위 문서의 설명에 근거한다.
