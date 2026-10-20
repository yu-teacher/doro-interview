---
slug: "web-15"
topic: "cs-web"
tier: DEEP
difficulty: 2
title: "CORS 에서 단순 요청과 preflight 요청은 어떻게 구분되고 preflight 는 어떻게 동작하나요?"
keywords: ["안전 목록 메서드 GET·HEAD·POST", "안전 목록 헤더와 Content-Type", "OPTIONS preflight", "Access-Control-Allow-Methods·Headers", "Access-Control-Max-Age 캐시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://fetch.spec.whatwg.org/"]
concepts: [web-security, http-protocol]
importance: 3
links: [{to: "web-18", kind: FOLLOWUP}, {to: "sec-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
교차 출처 요청이 안전 목록 메서드(GET, HEAD, POST)이고 헤더도 안전 목록 헤더뿐이고 Content-Type이 form-urlencoded, multipart/form-data, text/plain 중 하나면 preflight 없이 나갑니다. 아니면, 예컨대 PUT·DELETE이거나 Authorization 헤더나 application/json이 있으면 브라우저가 먼저 OPTIONS preflight를 보냅니다. 여기에 Origin, Access-Control-Request-Method, 필요하면 Request-Headers가 담기고, 서버가 ok 상태로 Access-Control-Allow-Origin과 필요한 Allow-Methods·Allow-Headers를 답해야 본 요청이 나갑니다. 결과는 Access-Control-Max-Age 동안 캐시되며 기본은 5초입니다.

```
(Chromium 156, 페이지 http://127.0.0.1:18801 -> API http://127.0.0.1:18802)
POST text/plain, ACAO 있음            : OPTIONS 없이 POST 만 도착, 성공
POST application/json, ACAO 응답 없음  : OPTIONS 만 도착, fetch 는 TypeError, POST 는 서버에 안 옴
POST application/json, preflight 허용  : OPTIONS 후 POST 도착, 성공
  (Max-Age 60 으로 같은 요청 반복)       : 두 번째는 OPTIONS 없이 POST 만 도착
  (Max-Age 없이, 7초 뒤 같은 요청)        : OPTIONS 가 다시 도착 (기본 5초 경과)
DELETE, preflight 허용                 : OPTIONS 후 DELETE
X-Token 헤더, Allow-Headers 누락       : OPTIONS 만 도착, 실패
```

(공식 문서) WHATWG Fetch 2.2.1은 CORS 안전 목록 메서드를 GET, HEAD, POST로 정의하고, 2.2.2는 안전 목록 요청 헤더가 Accept, Accept-Language, Content-Language, 조건을 만족하는 Content-Type(application/x-www-form-urlencoded, multipart/form-data, text/plain), Range(단순 범위)이며 값 길이 128 이하 등의 조건이 있다고 한다. 4.1 Main fetch는 안전하지 않은(unsafe) 요청이고 메서드가 안전 목록이 아니거나 안전하지 않은 헤더 이름이 있으면 CORS preflight를 한다고 한다. 3.3.2는 preflight가 OPTIONS 메서드와 Access-Control-Request-Method(및 Access-Control-Request-Headers) 헤더를 쓴다고 하고, 3.3.3은 성공적인 preflight 응답이 ok 상태(예: 200, 204)로 제한되며 Access-Control-Max-Age 는 초 단위이고 기본 5초라고 한다. 3.3.3과 3.3.5는 preflight 요청이 자격 증명 없이 간다고 하고, 4.8은 성공한 preflight 결과를 preflight 캐시에 둔다고 하고 사용자 에이전트가 max-age 상한을 둘 수 있다고 한다. 3.3.7은 application/csp-report 등 일부 Content-Type 을 예외로 인정하고, 2.2.2는 안전 목록 값 길이 합계가 1024바이트를 넘으면 안전하지 않은 것으로 본다.
(실험 확인) 위 블록은 Playwright 1.64.1 번들 Chromium 156.0.8078.4 헤드리스로 로컬 Node 서버 두 개(다른 포트라서 다른 출처)를 띄워 얻은 결과다. 브라우저가 preflight 캐시를 몇 초 보관하는지, 상한이 얼마인지는 브라우저 구현에 달려 있다. Max-Age 없는 응답은 5초 안의 두 번째 요청에서는 OPTIONS 가 다시 오지 않았고 7초 뒤에는 다시 왔다.
