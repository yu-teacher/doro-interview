---
slug: "web-18"
topic: "cs-web"
tier: TRICKY
difficulty: 3
title: "쿠키를 포함하는 CORS 요청에서 Access-Control-Allow-Origin: * 를 쓰면 왜 실패하나요?"
keywords: ["credentials 모드 include", "ACAO 와일드카드 불가", "구체적 출처와 Allow-Credentials: true", "true는 대소문자 구분", "응답 공유만 막고 요청은 도달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://fetch.spec.whatwg.org/"]
---
**모범 답변 (30~60초)**
요청의 credentials 모드가 include, 즉 fetch에 credentials: 'include'를 주거나 XHR에서 withCredentials를 켠 경우에는, 응답의 Access-Control-Allow-Origin이 *이면 CORS 검사가 실패하도록 표준이 정해 두었기 때문입니다. 자격 증명이 붙은 응답을 아무 출처에나 공유하면 위험하니, 허용할 출처를 구체적으로 적고 Access-Control-Allow-Credentials: true를 함께 보내야 하며 true는 대소문자를 구분합니다. Allow-Methods, Allow-Headers, Expose-Headers의 *도 같은 경우에는 와일드카드로 인정되지 않습니다. 또 CORS 검사는 브라우저가 응답을 스크립트에 넘길지 정하는 것이라서, 실패해도 요청은 서버에 이미 도착했고 쿠키도 실려 있을 수 있습니다.

```
(Chromium 156) fetch(url, {credentials:'include'})
ACAO: *       + Allow-Credentials: true  -> TypeError, 서버에는 GET 이 쿠키와 함께 도착
ACAO: <요청 Origin> + Allow-Credentials: true -> 성공
fetch(url) 서버가 CORS 헤더를 안 보냄    -> TypeError, 서버에는 GET 이 도착
fetch(url, {mode:'no-cors'})             -> type=opaque, status=0 (스크립트는 내용을 읽을 수 없음)
```

(공식 문서) WHATWG Fetch 3.3.5는 credentials 모드가 include일 때 CORS 프로토콜이 달라지며 Access-Control-Allow-Origin은 *가 될 수 없다고 하고, 표로 include + * + true 조합이 ❌, include + 구체 출처 + true 가 ✅, true 는 대소문자를 구분(True 는 ❌)한다고 보인다. 같은 절은 Access-Control-Expose-Headers, Allow-Methods, Allow-Headers 의 * 도 include 모드에서는 와일드카드로 쓸 수 없다고 하고 preflight 요청은 자격 증명을 절대 포함하지 않는다고 하며, 3.3.3은 그래서 자격 증명 지원 여부도 preflight 응답에서 알려야 한다고 한다. 4.10 CORS check는 Access-Control-Allow-Origin 값을 요청 출처와 대조해 실패를 반환하는 절차를 정의한다. 3.3.5는 자격 증명을 가진 응답의 공유와 요청 허용이 모두 꽤 위험하니 confused deputy 문제에 극히 주의하라고 경고한다.
(실험 확인) 위 블록은 Playwright 1.64.1 번들 Chromium 156.0.8078.4 헤드리스로 로컬 Node 서버를 상대로 한 결과다. 쿠키는 페이지 서버가 내려 준 것이고 쿠키는 포트가 달라도 같은 호스트(127.0.0.1)로 전송됐다.
