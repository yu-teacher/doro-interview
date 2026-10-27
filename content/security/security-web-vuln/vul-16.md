---
slug: "vul-16"
topic: "security-web-vuln"
tier: TRICKY
difficulty: 2
title: "CORS를 엄격하게 설정하면 CSRF나 무단 API 호출도 막히나요?"
keywords: ["CORS는 응답 공유 제어", "서버는 요청을 이미 처리함", "폼 수준 요청은 프리플라이트 없음", "브라우저가 아닌 클라이언트는 무관", "CSRF 방어와 서버 인가가 따로 필요"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://fetch.spec.whatwg.org/", "https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/index.html", "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"]
concepts: [cors-sop, csrf]
importance: 1
links: [{to: "vul-12", kind: PREREQ}, {to: "vul-05", kind: PREREQ}, {to: "fwp-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
아니요. CORS는 다른 출처의 스크립트가 응답을 읽어도 되는지를 서버가 허락하는 브라우저 규칙이지, 요청이 서버에 도달하는 것을 막는 접근 제어가 아닙니다. HTML 폼으로 보낼 수 있는 정도의 요청은 프리플라이트 없이 그대로 전송되고 서버가 처리하므로, 쿠키 인증을 쓴다면 CORS 설정과 상관없이 CSRF가 가능합니다. curl 같은 브라우저가 아닌 클라이언트에는 아예 적용되지도 않습니다. 그래서 CORS와 별개로 서버에서 인증·인가를 검사하고 상태 변경 요청에는 CSRF 토큰 같은 방어를 둬야 합니다. 반대로 CORS를 너그럽게 열면, 자격 증명이 붙은 교차 출처 응답을 공격자의 사이트가 읽을 수 있게 되는 위험이 생깁니다.

```
SERVER: POST handled, Origin = https://app.example.com
SERVER: POST handled, Origin = https://other.example     (허용 목록에 없는 출처, 응답에 CORS 헤더만 빠짐)
```

(공식 문서) WHATWG Fetch 표준 3.3절은 CORS를 교차 출처 응답을 공유할 수 있게 하는 옵트인 프로토콜로 설명하고, 폼보다 복잡한 요청에만 프리플라이트를 수행한다고 한다. 즉 폼으로 보낼 수 있는 수준의 요청에는 프리플라이트가 필수가 아니다. 성공적이지 않은 응답이라도 서버가 수행한 작업이 타이밍 같은 부채널로 샐 수 있다고 하고, 자격 증명이 붙은 응답이나 요청을 허용하는 것은 매우 위험해서 confused deputy 문제에 극히 주의해야 한다고 한다. 같은 문서의 안전한 기본 CORS 설정 절은 `Access-Control-Allow-Origin: *`로 공유하는 자원이 이미 curl과 wget에는 공유된 것과 같다고 설명하는데, 이는 curl 같은 클라이언트가 CORS와 무관하게 접근한다는 것을 전제로 한 설명이다.
(원저자 자료) OWASP Top 10:2021 A01 페이지는 CORS 설정 오류가 신뢰할 수 없는 출처에서의 API 접근을 허용한다고 취약 사례로 든다. OWASP CSRF 시트는 모든 하위 도메인을 정규식으로 허용하는 CORS 설정은 하위 도메인 탈취 시 동일 출처 정책을 우회당할 수 있다고 경고하고, CSRF 방어로 토큰이나 커스텀 헤더 등을 별도로 권한다.
(실험 확인) 위 블록은 Python 3.14로 만든 허용 목록 CORS 서버에 curl 8.7.1로 서로 다른 `Origin` 헤더를 붙여 POST한 결과다. 허용되지 않은 출처의 요청도 서버 핸들러까지 도달해 처리됐고 응답에서 CORS 헤더만 빠졌다. curl은 브라우저가 아니라서 CORS를 집행하지 않는 클라이언트의 예일 뿐 브라우저의 동작을 확인한 것은 아니다.
