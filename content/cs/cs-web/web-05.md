---
slug: "web-05"
topic: "cs-web"
tier: BASIC
difficulty: 2
title: "쿠키의 Secure, HttpOnly, Domain, Path, Max-Age 속성은 각각 무엇을 제어하나요?"
keywords: ["Secure는 보안 채널에서만 전송", "HttpOnly는 스크립트 API에서 제외", "Domain은 전송 호스트 범위", "Path는 경로 범위", "Max-Age가 Expires보다 우선"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc6265.html"]
---
**모범 답변 (30~60초)**
서버가 Set-Cookie로 쿠키를 내려 주면 브라우저가 이후 요청의 Cookie 헤더에 담아 돌려보냅니다. Secure는 HTTPS 같은 보안 채널로 가는 요청에만 쿠키를 포함하게 하는 속성이고, HttpOnly는 쿠키를 스크립트가 쓰는 API에는 노출하지 않고 HTTP 요청에만 쓰게 하는 속성입니다. Domain은 쿠키를 보낼 호스트 범위를, Path는 보낼 경로 범위를 정하는데, Domain을 생략하면 쿠키를 내려 준 서버에만 돌려줍니다. Max-Age와 Expires는 수명을 정하며 둘이 같이 있으면 Max-Age가 우선입니다. 다만 Secure는 기밀성만 지켜 줄 뿐이고 Path를 보안 경계로 믿으면 안 된다고 표준에 적혀 있습니다.

```
Set-Cookie: sid=S1; HttpOnly; Path=/
Set-Cookie: adm=A1; Path=/admin; Max-Age=3600

document.cookie            -> "pref=dark; sec=X1"        (sid 는 안 보임)
GET /      의 Cookie 헤더   -> sid=S1; pref=dark; sec=X1  (adm 없음)
GET /admin 의 Cookie 헤더   -> adm=A1; sid=S1; pref=dark; sec=X1
```

(공식 문서) RFC 6265 4.1.2.5는 Secure 쿠키가 "보안 채널"(보안 채널의 정의는 사용자 에이전트에 맡김, 보통 TLS 위의 HTTP)로 전송되는 요청에만 포함되며, 이것은 기밀성만 보호하고 능동적 네트워크 공격자가 비보안 채널에서 Secure 쿠키를 덮어써 무결성을 해칠 수 있다고 한다. 4.1.2.6은 HttpOnly가 쿠키 범위를 HTTP 요청으로 제한하고 스크립트에 쿠키를 노출하는 비 HTTP API에서는 제외하게 한다고 하며 Secure와는 독립이라고 한다. 4.1.2.3은 Domain을 생략하면 원 서버에만 돌려준다고 하고, 4.1.2.4는 Path가 보안에 의존할 수 없다고 하며, 4.1.2.2는 Max-Age와 Expires가 같이 있으면 Max-Age가 우선이고 둘 다 없으면 에이전트가 정한 세션 종료 때까지 보관한다고 한다. 8.6은 Path가 무결성 보호를 주지 못한다고 한다. 이 RFC 본문에는 SameSite 라는 말이 한 번도 나오지 않는다(내려받은 텍스트에서 0건 확인). 그래서 SameSite 는 이 질문에서 다루지 않는다.
(실험 확인) 위 블록은 Playwright 1.64.1 번들 Chromium 156.0.8078.4 헤드리스로 로컬 Node 서버에 접속한 결과다. Max-Age=0 으로 보낸 쿠키는 저장되지 않았다. 또 로컬 루프백(127.0.0.1)에서는 http 로 접속했는데도 Secure 쿠키가 저장되고 전송됐다(curl 8.7.1 도 같음). 그래서 Secure 쿠키가 http 에서 막히는 동작은 이 환경에서 확인하지 못했다. 이는 RFC 가 보안 채널의 정의를 에이전트에 맡긴다는 서술과 모순되지 않는다.
