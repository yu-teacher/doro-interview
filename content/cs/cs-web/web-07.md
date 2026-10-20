---
slug: "web-07"
topic: "cs-web"
tier: BASIC
difficulty: 1
title: "Cache-Control: max-age 는 무엇이고 캐시는 저장한 응답을 다시 써도 되는지 어떻게 판단하나요?"
keywords: ["신선도 수명이 나이보다 크면 신선", "max-age는 초 단위 수명", "Expires보다 max-age 우선", "신선하면 서버 접속 없이 재사용", "stale이면 재검증"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9111.html"]
concepts: [cache, http-protocol]
importance: 3
links: [{to: "web-10", kind: FOLLOWUP}, {to: "web-16", kind: FOLLOWUP}, {to: "web-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
캐시는 저장한 응답의 신선도 수명이 현재 나이보다 크면 신선하다고 보고, 서버에 묻지 않고 그 응답을 재사용합니다. 나이는 서버가 응답을 만들었거나 마지막으로 검증한 뒤 지난 시간입니다. 신선도 수명은 공유 캐시면 s-maxage, 그다음 max-age, 그다음 Expires에서 Date를 뺀 값 순으로 먼저 맞는 규칙을 쓰므로, max-age=60이면 60초 동안 서버 접속 없이 쓰입니다. 시간이 지나 stale이 되면 보통 바로 버리지 않고 조건부 요청으로 재검증해서, 바뀌지 않았다면 304로 계속 씁니다. 명시적 만료 정보가 없으면 캐시가 Last-Modified 등으로 수명을 추정하는 휴리스틱도 허용됩니다.

```
Cache-Control: max-age=60 인 응답을 fetch 로 3번 요청 -> 서버에 도착한 요청 1건
```

(공식 문서) RFC 9111 4.2는 신선도를 response_is_fresh = (freshness_lifetime > current_age) 로 정의하고, 신선한 응답은 원 서버에 접속하지 않고 후속 요청에 쓸 수 있다고 한다. 나이는 서버가 응답을 만들었거나 성공적으로 검증한 뒤 지난 시간이다. 4.2.1은 신선도 수명을 공유 캐시의 s-maxage, max-age, Expires에서 Date를 뺀 값 순으로 처음 맞는 규칙으로 계산한다고 한다. 4.2는 준수하는 캐시가 stale 응답을 재사용하기 전에 보통 검증한다고 하고, 4.2.2는 명시적 만료가 없으면 캐시가 휴리스틱 만료 시각을 정해도 되고(MAY), 명시적 만료가 있으면 휴리스틱을 쓰면 안 되며(MUST NOT), Last-Modified 가 있으면 그 시점 이후 간격의 일부 이하를 쓰도록 권장하고(전형적인 비율 10%) 구체 알고리즘은 정하지 않는다고 한다. 5.2.2.1은 max-age를 나이가 지정한 초를 넘으면 stale이라는 뜻으로 정의한다.
(실험 확인) Playwright 1.64.1 의 Chromium 156.0.8078.4 에서 같은 URL 을 fetch 로 3번 호출했는데 로컬 서버는 요청을 1번만 받았다. 같은 조건에서 max-age 없이 no-cache 만 준 응답은 3번 모두 서버에 도착했다.
