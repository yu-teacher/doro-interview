---
slug: "web-10"
topic: "cs-web"
tier: DEEP
difficulty: 2
title: "ETag 와 If-None-Match 로 하는 조건부 요청은 어떻게 동작하고 304 는 무엇인가요?"
keywords: ["ETag는 표현의 검증자", "If-None-Match에 ETag 전달", "304는 본문 없음", "약한 ETag W/", "다른 메서드는 412"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc9111.html"]
---
**모범 답변 (30~60초)**
서버가 응답에 ETag, 즉 표현을 식별하는 불투명한 검증자를 담아 주면, 클라이언트나 캐시는 나중에 같은 자원을 다시 요청하면서 If-None-Match에 그 값을 실어 보냅니다. 서버는 현재 표현의 ETag가 목록에 있으면 조건이 거짓이므로 요청을 수행하지 않고, GET이나 HEAD에는 304 Not Modified를 돌려줍니다. 304에는 본문이 없어서 클라이언트는 저장해 둔 사본을 계속 쓰고 전송량만 아낍니다. GET과 HEAD가 아닌 메서드에서는 조건이 거짓일 때 412가 나갑니다. ETag에는 W/ 접두사가 붙는 약한 값도 있는데, 표현이 바뀔 때마다 값이 바뀌지는 않을 수 있는 검증자이고, If-None-Match 비교에는 약한 비교를 씁니다.

```
GET /etag                               -> 200, ETag: "v1", 본문 있음
GET /etag  If-None-Match: "v1"          -> 304 Not Modified (본문 없음)
Chromium, Cache-Control: no-cache + ETag 응답을 fetch 3번
  서버에 도착한 요청: [full, conditional, conditional]  (JS 는 매번 200 을 받음)
```

(공식 문서) RFC 9110 8.8.3은 ETag를 선택된 표현의 현재 엔티티 태그로 정의하고, 엔티티 태그는 표현을 구별하는 불투명 값이며 W/ 접두사로 약한 것을 표시한다고 한다. 13.1.2는 If-None-Match가 현재 표현의 태그가 목록에 없을 때만 메서드를 수행하게 하고, 비교에는 약한 비교를 MUST 써야 한다고 하며, 조건이 거짓이면 GET/HEAD에는 304, 다른 메서드에는 412로 응답해야 한다고 한다. 15.4.5는 304가 클라이언트가 이미 유효한 표현을 가지고 있어 전송이 필요 없다는 뜻이고, 304는 헤더 섹션 끝에서 끝나며 본문이나 트레일러를 가질 수 없다고 한다. 8.8.1은 약한 검증자를 표현 데이터가 바뀌어도 값이 바뀌지 않을 수 있는 메타데이터로 정의하고, 8.8.3.2의 약한 비교는 W/ 여부와 무관하게 opaque-tag 가 문자 단위로 같으면 동등으로 본다. RFC 9111 4.3은 캐시가 stale 응답을 조건부 요청으로 재검증한다고 설명한다.
(실험 확인) curl 8.7.1 과 Python 3.14 연습용 서버로 200 과 304 를 확인했다. Chromium 156.0.8078.4(Playwright 1.64.1)에서는 fetch 가 304 를 감추고 스크립트에는 200 으로 보였지만, 서버에는 두 번째부터 If-None-Match 가 실린 조건부 요청이 도착했다.
