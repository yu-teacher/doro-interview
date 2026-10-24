---
slug: "vul-12"
topic: "security-web-vuln"
tier: DEEP
difficulty: 2
title: "CORS는 무엇이고, 왜 `Access-Control-Allow-Origin: *`와 쿠키 인증은 같이 쓸 수 없나요?"
keywords: ["동일 출처 정책 완화", "프리플라이트 OPTIONS", "허용 출처를 명시", "자격 증명 포함 요청에서 와일드카드 불가", "Vary: Origin"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://fetch.spec.whatwg.org/", "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html", "https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html"]
concepts: [cors-sop]
importance: 3
links: [{to: "vul-16", kind: FOLLOWUP}, {to: "web-15", kind: RELATED}, {to: "web-18", kind: RELATED}, {to: "sec-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
CORS는 브라우저의 동일 출처 정책 때문에 막히는 교차 출처 응답을, 서버가 헤더로 명시해서 공유해도 된다고 허락하게 해 주는 프로토콜입니다. HTML 폼으로 보낼 수 있는 것보다 복잡한 요청이면 브라우저가 먼저 `OPTIONS` 프리플라이트를 보내 서버가 CORS를 이해하는지 확인합니다. 쿠키 같은 자격 증명을 포함하는 요청에서는 `Access-Control-Allow-Origin`에 `*`를 쓸 수 없고, 구체적인 출처와 `Access-Control-Allow-Credentials: true`가 함께 있어야 응답이 공유됩니다. 요청의 출처에 따라 응답 헤더를 바꾼다면 캐시가 섞이지 않도록 `Vary: Origin`을 붙이고, 허용 출처는 필요한 것만 명시합니다.

```
허용 출처(https://app.example.com)에서 온 POST -> Access-Control-Allow-Origin: https://app.example.com
                                                  Access-Control-Allow-Credentials: true
                                                  Vary: Origin
다른 출처에서 온 POST                         -> 위 두 Access-Control 헤더 없음 (Vary: Origin 은 유지)
허용 출처의 프리플라이트(OPTIONS)              -> 204 + Allow-Methods, Allow-Headers
```

(공식 문서) WHATWG Fetch 표준 3.3절은 CORS 프로토콜을 교차 출처 응답 공유를 허용하는 옵트인 방식으로 설명하고, 특히 자격 증명이 있는 요청은 민감한 데이터 유출을 막기 위해 옵트인이어야 한다고 한다. 폼보다 복잡한 요청에는 프리플라이트가 수행되고, 프리플라이트 요청에는 자격 증명이 포함되지 않는다. 3.3.5절의 표는 자격 증명 모드가 include일 때 `Access-Control-Allow-Origin`은 `*`일 수 없고 구체적 출처와 `Access-Control-Allow-Credentials: true`가 필요하다고 보이며, 자격 증명이 있는 응답 공유는 confused deputy 문제 때문에 매우 조심해야 한다고 한다. 응답이 요청 출처에 따라 달라지면 `Vary: Origin`을 쓰라고 한다.
(원저자 자료) OWASP HTTP Headers Cheat Sheet는 이 헤더가 없으면 동일 출처 정책이 기본 보호이고, 쓸 때는 `*` 대신 구체적 출처를 쓰라고 한다. 공개 API처럼 어디서든 접근돼야 하면 `*`가 필요할 수 있다고 덧붙인다.
(공식 문서) Spring Security CORS 문서는 프리플라이트 요청에는 쿠키가 없으므로 CORS를 Spring Security보다 먼저 처리해야 한다고 한다.
(실험 확인) Python 3.14로 만든 연습용 서버에 curl 8.7.1로 `Origin` 헤더를 바꿔 요청한 결과를 요약한 것이 위 블록이다. 내가 짠 허용 목록 로직의 동작이며 브라우저 동작을 실행한 것은 아니다.
