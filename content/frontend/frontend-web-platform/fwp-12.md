---
slug: "fwp-12"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "쿠키의 `Secure`, `HttpOnly`, `Domain`, `Path` 속성은 각각 무엇을 하나요?"
keywords: ["Secure는 보안 채널로만 전송", "HttpOnly는 스크립트 접근 차단", "Domain은 전송 대상 호스트 범위", "Path는 요청 경로 범위", "Max-Age와 Expires가 없으면 세션 쿠키"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6265.html"]
concepts: [cookie]
importance: 2
links: [{to: "fwp-20", kind: FOLLOWUP}, {to: "fwp-05", kind: PREREQ}, {to: "web-05", kind: RELATED}, {to: "vul-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
`Secure`가 있으면 브라우저는 HTTPS 같은 보안 채널로 가는 요청에만 그 쿠키를 보냅니다. `HttpOnly`는 `document.cookie` 같은 스크립트용 API에 쿠키를 노출하지 않게 해서, 스크립트가 쿠키 값을 읽지 못하게 합니다. `Domain`을 지정하면 그 도메인과 하위 도메인으로 가는 요청에도 쿠키를 보내고, 생략하면 쿠키를 설정한 서버로만 보냅니다. `Path`는 요청 경로가 그 값 아래일 때만 쿠키를 보내게 합니다. `Max-Age`나 `Expires`가 둘 다 없으면 현재 세션이 끝날 때 사라지는 세션 쿠키가 되고, 세션이 언제 끝나는지는 브라우저가 정합니다.

```
Set-Cookie: sid=abc; Path=/; HttpOnly
Set-Cookie: theme=dark; Path=/app; Max-Age=3600
Set-Cookie: tmp=1; Path=/

GET /app/x -> Cookie: theme=dark; sid=abc; tmp=1
GET /other -> Cookie: sid=abc; tmp=1
curl 쿠키 저장 파일: sid 는 #HttpOnly_ 표시, theme 은 만료 시각 있음, tmp 는 만료 0(세션 쿠키)
```

(공식 문서) RFC 6265 4.1.2.5는 `Secure`가 쿠키 범위를 보안 채널(보통 TLS 위의 HTTP)로 제한한다고 하고, 다만 이것은 기밀성만 보호하며 능동적 네트워크 공격자가 안전하지 않은 채널에서 `Secure` 쿠키를 덮어써 무결성을 해칠 수 있다고 경고한다. 4.1.2.6은 `HttpOnly`가 스크립트에 쿠키를 노출하는 비 HTTP API에서 쿠키를 빼게 하며 `Secure`와 독립이라고 한다. 4.1.2.3은 `Domain`이 `example.com`이면 `www.corp.example.com` 같은 하위 도메인으로도 보내고, 생략하면 원 서버에만 돌려준다고 하면서, 생략을 현재 호스트 이름 지정으로 취급해 하위 도메인에도 보내는 사용자 에이전트가 있다고 경고한다. 4.1.2.4는 `Path`를 보안 수단으로 기대할 수 없다고 적는다. 4.1.2는 쿠키가 기본적으로 현재 세션 끝(사용자 에이전트가 정의)에 만료된다고 하고, 5.3의 저장 절차는 `Max-Age`나 `Expires`가 없으면 persistent 플래그를 false로 둔다.
(실험 확인) 127.0.0.1에서 Python 3.14.0 `http.server`가 위 `Set-Cookie`를 보내게 하고 curl 8.7.1의 쿠키 저장 파일(`-c`, `-b`)로 확인했다. `Path=/app` 쿠키는 `/app/x`에만 전송됐고 `HttpOnly`는 저장 파일에 `#HttpOnly_` 접두로 남았다. curl은 브라우저가 아니라 `HttpOnly`가 스크립트 접근을 막는 동작은 실행하지 못했고, 쿠키 저장·전송 규칙만 확인한 것이다.
