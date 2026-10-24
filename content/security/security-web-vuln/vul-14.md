---
slug: "vul-14"
topic: "security-web-vuln"
tier: DEEP
difficulty: 2
title: "보안 응답 헤더 중 HSTS, X-Content-Type-Options, frame-ancestors는 각각 무엇을 위한 건가요?"
keywords: ["HSTS는 HTTPS 강제", "nosniff는 MIME 추측 방지", "frame-ancestors는 클릭재킹 방지", "X-XSS-Protection은 끄기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6797.html", "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html", "https://www.w3.org/TR/CSP3/", "https://docs.spring.io/spring-security/reference/servlet/exploits/headers.html"]
concepts: [web-security, tls-pki]
importance: 2
links: [{to: "sec-14", kind: RELATED}, {to: "web-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
HSTS(`Strict-Transport-Security`)는 한 번 HTTPS로 응답받은 호스트에 대해, 브라우저가 이후 http 요청을 알아서 https로 바꾸고 보안 연결에 오류가 있으면 연결을 끊게 하는 헤더입니다. `X-Content-Type-Options: nosniff`는 브라우저가 Content-Type을 무시하고 내용을 추측해서 실행 가능한 형식으로 해석하는 MIME 스니핑을 막습니다. 클릭재킹은 다른 사이트의 프레임에 내 페이지를 넣어 속이는 공격인데, 이를 막던 `X-Frame-Options`는 CSP의 `frame-ancestors`가 대체하므로 OWASP는 가능하면 후자를 권합니다. `X-XSS-Protection`은 일부 경우 오히려 취약점을 만들 수 있어 켜지 말고 끄는 값을 권합니다.

(공식 문서) RFC 6797은 HSTS 정책의 효과를 두 가지로 요약한다. 사용자 에이전트가 안전하지 않은 URI 참조를 안전한 것으로 바꾼 뒤 접근하고, 보안 전송 오류나 경고가 나면 연결을 끊는다는 것이다. 8.1절은 `max-age=0`이면 저장된 정책을 지우고 비보안 전송으로 받은 STS 헤더는 무시한다고 하며, 6.1.2절은 `includeSubDomains` 지시문을 정의하고, 7.2절은 서버가 비보안 전송 응답에 STS 헤더를 넣지 말라고(MUST NOT) 한다. 14.6절은 사용자가 알려지지 않은 호스트에 처음 `http` 주소로 접속하면 첫 상호작용이 안전하지 않은 채널을 거쳐 공격에 노출되는 부트스트랩 MITM 취약점이 있다고 설명한다.
(원저자 자료) OWASP HTTP Headers Cheat Sheet는 `X-Frame-Options`는 CSP `frame-ancestors`로 대체되므로 가능하면 후자를 쓰라고 하고, `X-XSS-Protection`은 일부 경우 안전한 사이트에 XSS를 만들 수 있어 설정하지 않거나 `0`으로 끄라고 하며, `X-Content-Type-Options: nosniff`는 MIME 스니핑을 막는다고 한다. HSTS 예시로 `max-age=63072000; includeSubDomains; preload`를 권고하면서, 인증서 문제가 있으면 만료까지 접속이 막힐 수 있으니 동작 방식을 잘 읽고 쓰라고 경고한다.
(공식 문서) W3C CSP3의 `frame-ancestors`는 프레임·iframe·object·embed로 리소스를 넣을 수 있는 URL을 제한하는 지시문이며 UI 리드레싱 공격을 줄인다고 한다. Spring Security 문서는 기본 보안 헤더 세트를 제공한다고 하며, 캐시 제어, Content-Type 옵션, HSTS 등을 기본으로 포함하고 CSP와 Referrer Policy는 기본으로 추가하지 않는다고 한다.
