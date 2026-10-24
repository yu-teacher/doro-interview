---
slug: "fwp-09"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "CORS 는 어떻게 동작하나요? 단순 요청과 프리플라이트 요청은 무엇이 다른가요?"
keywords: ["Origin 요청 헤더", "Access-Control-Allow-Origin 응답 헤더", "프리플라이트 OPTIONS", "안전 목록 메서드와 헤더", "자격 증명 포함 시 와일드카드 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://fetch.spec.whatwg.org/"]
concepts: [cors-sop]
importance: 3
links: [{to: "fwp-17", kind: FOLLOWUP}, {to: "web-15", kind: RELATED}, {to: "vul-12", kind: RELATED}, {to: "sec-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
다른 출처로 `fetch`를 보내면 브라우저가 요청에 `Origin` 헤더를 붙이고, 서버가 응답의 `Access-Control-Allow-Origin`에 그 출처나 `*`를 넣어 주면 스크립트가 응답을 읽을 수 있습니다. 메서드가 `GET`·`HEAD`·`POST`이고 헤더와 `Content-Type`이 사양의 안전 목록 안에 있으면 바로 본 요청을 보냅니다. `PUT`이나 `application/json`처럼 벗어나면 먼저 `OPTIONS` 프리플라이트로 `Access-Control-Request-Method`와 `Access-Control-Request-Headers`를 보내 허락을 확인합니다. 쿠키를 포함하는 `credentials: "include"` 요청은 출처에 `*`를 쓸 수 없고 `Access-Control-Allow-Credentials: true`도 있어야 합니다.

(공식 문서) Fetch 표준 3.3은 CORS 프로토콜이 HTTP 위에 올라가 응답이 다른 출처와 공유될 수 있다고 선언하게 하는 옵트인 방식이라고 한다. CORS 요청은 `Origin` 헤더가 있는 HTTP 요청이고, 프리플라이트는 `OPTIONS` 메서드에 `Access-Control-Request-Method`(와 선택적으로 `Access-Control-Request-Headers`)를 담아 보내는 요청이다. 응답 쪽에서는 `Access-Control-Allow-Origin`이 `Origin` 값이나 `*`를 돌려주고, 프리플라이트 응답은 `Access-Control-Allow-Methods`·`Access-Control-Allow-Headers`·`Access-Control-Max-Age`(기본 5초)를 쓰며 성공 상태가 200이나 204 같은 ok 상태로 제한된다.
(공식 문서) 같은 표준에서 CORS 안전 목록 메서드는 `GET`, `HEAD`, `POST`이고, `Content-Type`의 안전 목록 값은 `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`뿐이다. 요청 메서드가 안전 목록 밖이거나 안전하지 않은 헤더가 있으면 프리플라이트를 수행하고(해당 요청이 unsafe-request 플래그가 선 경우), 업로드 이벤트 리스너나 `ReadableStream` 본문이 있어 use-CORS-preflight 플래그가 서도 프리플라이트가 일어난다. 따라서 `application/json` 본문은 프리플라이트 대상이라는 것은 이 규칙에서 이끌어낸 결론이다. 3.3.5는 자격 증명 모드가 `include`이면 `Access-Control-Allow-Origin`에 `*`를 쓸 수 없고 `Access-Control-Allow-Credentials`가 대소문자까지 정확히 `true`여야 하며, 프리플라이트 요청은 자격 증명을 포함하지 않는다고 한다.
