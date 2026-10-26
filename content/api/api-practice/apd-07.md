---
slug: "apd-07"
topic: "api-practice"
tier: BASIC
difficulty: 2
title: "API에 속도 제한을 둘 때 한도를 넘은 요청에는 어떻게 응답하고, 남은 한도는 어떻게 알려주나요?"
keywords: ["429 Too Many Requests", "Retry-After로 대기 시간 안내", "응답 본문에 원인 설명", "RateLimit 헤더는 아직 초안", "한도는 고객·앱 단위로 구분"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc6585.html", "https://www.rfc-editor.org/rfc/rfc9110.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/"]
concepts: [resilience, http-status-error]
importance: 2
links: [{to: "apd-14", kind: FOLLOWUP}, {to: "web-09", kind: RELATED}, {to: "scl-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
한도를 넘으면 429 Too Many Requests로 응답하고, 본문에는 어떤 한도를 넘었는지 설명을 담습니다. 기다릴 시간은 `Retry-After` 헤더로 알려 줄 수 있는데 값은 초 단위 숫자나 날짜입니다. Microsoft 가이드라인은 429에 표준 오류 본문과 `Retry-After`를 반드시 넣으라고 하고, 한도는 구독·테넌트·앱 같은 고객 단위로 나눠 한 고객이 다른 고객을 방해하지 않게 하라고 권고합니다. 남은 한도를 알리는 `RateLimit` 헤더는 아직 IETF 인터넷 초안이고, 가이드라인이 예로 든 헤더 이름과 최신 초안의 이름이 서로 다릅니다. 쓴다면 문서화하고, 클라이언트는 항상 온다고 가정하면 안 됩니다.

(공식 문서) RFC 6585 4절은 429를 사용자가 주어진 시간에 너무 많은 요청을 보냈다는 뜻으로 정의하고, 응답 표현에 이유를 담는 것(SHOULD)과 `Retry-After`를 넣는 것(MAY)을 말하며, 사용자 식별과 요청 집계 방식은 정하지 않는다. RFC 9110 10.2.3은 `Retry-After` 값이 HTTP 날짜나 초 단위 지연이라고 한다. Microsoft 가이드라인 14.4는 한도 초과 시 429, 표준 오류 응답, `Retry-After`를 MUST로 요구하고 `RateLimit-Limit`·`RateLimit-Remaining`·`RateLimit-Reset` 헤더는 MAY로 요구하고, 같은 장 앞부분(14.1 근처)은 한도를 구독·테넌트·앱 같은 고객 단위로 나누라고 한다. 이 헤더 이름은 draft-ietf-httpapi-ratelimit-headers-11(2026-05)의 `RateLimit-Policy`·`RateLimit`와 다르다. 이 초안은 두 헤더를 정의하면서 `Retry-After`와 함께 오면 `Retry-After`가 우선하고, 클라이언트는 이후 응답에 이 헤더가 계속 온다고 가정하면 안 된다고 한다.
(실험 확인) localhost의 Node 24 연습용 서버(고정 창, 2초에 3회)에서 4번째 호출이 429와 `Retry-After: 2`를 받았고, 클라이언트가 그만큼 기다린 뒤 5번의 호출을 모두 성공시켰다(총 약 2초). 한도 알고리즘은 내가 정한 것이다.
