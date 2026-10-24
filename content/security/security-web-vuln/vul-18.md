---
slug: "vul-18"
topic: "security-web-vuln"
tier: TRICKY
difficulty: 3
title: "SameSite=Lax 쿠키를 쓰면 CSRF 토큰은 필요 없나요?"
keywords: ["Lax는 안전한 메서드의 최상위 이동에 쿠키 전송", "GET으로 상태를 바꾸면 뚫림", "사이트 단위라 형제 서브도메인 위험", "지원하지 않는 브라우저", "토큰과 함께 쓰는 방어 심층"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"]
concepts: [csrf, cookie]
importance: 2
links: [{to: "vul-08", kind: PREREQ}, {to: "vul-06", kind: PREREQ}, {to: "fwp-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
대부분의 경우 필요합니다. OWASP는 SameSite를 방어 심층으로 보고, 대부분의 배포에서 CSRF 방어를 대체하지 못한다고 합니다. Lax는 링크 이동 같은 안전한 메서드의 최상위 교차 사이트 이동에는 쿠키를 보내므로, GET으로 상태를 바꾸는 엔드포인트가 하나라도 있으면 뚫립니다. 또 SameSite의 기준은 출처가 아니라 사이트(등록 가능한 도메인)라서, 같은 상위 도메인의 다른 서브도메인이 취약하거나 탈취되면 거기서 온 요청은 같은 사이트로 취급됩니다. SameSite를 집행하지 않는 구형 브라우저와, 내 사이트의 자바스크립트가 위조 요청을 만들어 내는 클라이언트 측 CSRF도 막지 못합니다. 그래서 CSRF 토큰이나 Origin 검증과 함께 씁니다.

(원저자 자료) OWASP CSRF Prevention Cheat Sheet는 SameSite의 알려진 한계로 다섯 가지를 든다. Lax는 안전한 메서드의 최상위 이동에는 쿠키를 보내므로 GET으로 상태를 바꾸는 곳이 있으면 막지 못하고 이것이 가장 흔한 실패 원인이라고 한다. SameSite는 출처가 아니라 등록 가능한 도메인 단위여서 형제 호스트의 취약점이나 하위 도메인 탈취가 위험하다. 최상위 이동이나 창 열기 같은 방식으로 같은 사이트 요청이 만들어질 수 있고, 모든 브라우저가 집행하는 것은 아니며, 클라이언트 측 CSRF는 SameSite가 막지 못한다. 시트는 이 한계들이 모두 해소되는 좁은 배포(Strict 또는 Lax와 `__Host-`, GET 점검, Origin 검증 등)에서는 SameSite만으로도 합리적인 방어가 될 수 있다고 하고, 그 외에는 토큰이나 더블 서브밋과 함께 쓰라고 한다. Session Management Cheat Sheet도 SameSite를 CSRF 토큰의 대체가 아닌 방어 심층으로 다루라고 한다.
