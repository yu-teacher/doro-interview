---
slug: "fwp-17"
topic: "frontend-web-platform"
tier: TRICKY
difficulty: 3
title: "CORS 에러가 나면 요청이 서버에 도달하지 않은 건가요? CORS 는 서버를 보호하나요?"
keywords: ["브라우저가 응답 읽기를 막음", "단순 요청은 서버로 전송됨", "프리플라이트 실패 시 본 요청 미전송", "서버 보호 수단이 아님", "인증·인가는 서버에서"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://fetch.spec.whatwg.org/", "https://www.rfc-editor.org/rfc/rfc6454.html"]
concepts: [cors-sop, web-security]
importance: 2
links: [{to: "fwp-09", kind: PREREQ}, {to: "vul-16", kind: RELATED}, {to: "web-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. CORS는 서버를 지키는 장치가 아니라, 다른 출처의 스크립트가 응답을 읽어도 되는지를 서버가 브라우저에게 알리는 옵트인 규칙입니다. 안전 목록에 해당하는 요청은 프리플라이트 없이 서버로 그대로 가고, 서버가 처리한 뒤 응답에 허용 헤더가 없으면 브라우저가 스크립트에 응답을 넘기지 않을 뿐이라서 서버의 부작용은 이미 일어났을 수 있습니다. 프리플라이트가 필요한 요청은 확인이 실패하면 본 요청이 전송되지 않습니다. 브라우저가 아닌 클라이언트에는 이 제한이 걸리지 않으므로 인증·인가와 CSRF 방어는 서버가 따로 해야 합니다.

```
서버: Access-Control-Allow-Origin 없이 POST 를 처리하는 연습용 Python 서버
$ curl -X POST -H 'Origin: https://foo.invalid' --data 'item=1' http://127.0.0.1:PORT/orders
응답: 200 created order 1
서버 로그: handled POST body='item=1' Origin='https://foo.invalid'
```

(공식 문서) Fetch 표준 3.3은 CORS가 인트라넷 같은 방화벽 뒤 응답이나 자격 증명이 포함된 응답의 데이터 유출을 막기 위해 옵트인이어야 한다고 설명한다. 프리플라이트 성공 응답은 ok 상태로 제한되고, 성공이 아닌 응답은 공유되지 않거나 프리플라이트를 실패시키며, 서버가 수행한 작업은 타이밍 같은 부수 채널로 새어 나갈 수 있다고 경고한다. HTTP fetch 알고리즘은 필요한 프리플라이트의 결과가 네트워크 오류이면 그 오류를 돌려주고 본 요청으로 진행하지 않으며, 프리플라이트가 필요 없는 요청은 HTTP-network-or-cache fetch로 요청을 보내 응답을 받은 다음에 그 응답에 CORS 검사를 하고 실패하면 네트워크 오류를 돌려준다(요청이 먼저 나가고 검사가 뒤에 온다).
(공식 문서) RFC 6454 3.4.2는 다른 출처에서 정보를 읽는 것은 일반적으로 금지되지만 다른 출처로 정보를 보내는 것은 허용된다고 하며, 3.4.3은 다른 출처로 네트워크 요청을 보낼 수 있는 능력이 CSRF 취약점의 원인이 된다고 적는다.
(실험 확인) 127.0.0.1의 Python 3.14.0 서버가 `Access-Control-Allow-Origin` 없이 `POST`를 처리하게 하고, curl 8.7.1로 `Origin` 헤더를 붙여 보내자 서버가 본문을 처리하고 200으로 응답했다. curl은 브라우저가 아니라서 CORS 검사 자체를 실행하지는 못했고, 서버가 요청을 처리하는 데 CORS 헤더가 필요하지 않다는 것만 보인 것이다.
(보충) 인증·인가와 CSRF 방어를 서버가 따로 해야 한다는 결론과, 브라우저가 아닌 클라이언트에는 이 제한이 걸리지 않는다는 일반화는 위 근거에서 이끌어낸 설명이다. 위 실험은 curl 한 가지만 확인했고 모든 비브라우저 클라이언트를 조사한 것은 아니다.
