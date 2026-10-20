---
slug: "web-09"
topic: "cs-web"
tier: DEEP
difficulty: 2
title: "429 와 503 은 어떻게 다르고 Retry-After 는 어떻게 쓰나요?"
keywords: ["429는 속도 제한", "503은 일시적 과부하나 점검", "Retry-After는 초 또는 날짜", "429 응답은 캐시 저장 금지", "집계 기준은 서버 재량"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc6585.html"]
concepts: [http-protocol, resilience]
importance: 2
links: [{to: "dst-19", kind: RELATED}, {to: "dst-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
429 Too Many Requests는 사용자가 정해진 시간에 요청을 너무 많이 보냈다는 속도 제한 응답으로 RFC 6585에 정의돼 있고, 누구를 어떻게 세는지는 서버 재량이라서 사용자별이든 리소스별이든 서버 전체든 상관없습니다. 503 Service Unavailable은 서버가 일시적인 과부하나 점검 때문에 지금 요청을 처리할 수 없고 곧 나아질 것이라는 뜻으로 RFC 9110에 있습니다. 둘 다 Retry-After 헤더로 기다릴 시간을 초 단위 숫자나 날짜로 알려 줄 수 있지만 필수는 아니고 선택입니다. 429 응답은 캐시가 저장하면 안 되고, 서버가 과부하일 때 꼭 503을 써야 하는 것도 아니라서 연결을 그냥 거절하는 서버도 있습니다.

```
GET /limited -> HTTP/1.1 429 Too Many Requests, Retry-After: 3
GET /down    -> HTTP/1.1 503 Service Unavailable, Retry-After: 120
```

(공식 문서) RFC 6585 4절은 429가 사용자가 주어진 시간에 너무 많은 요청을 보냈다는("rate limiting") 뜻이고, 표현에 이유를 담는 것이 SHOULD, Retry-After를 포함하는 것이 MAY이며, 사용자 식별과 요청 집계 방식은 정의하지 않는다고 하고, 429 응답은 캐시가 저장해서는 안 된다(MUST NOT)고 한다. RFC 9110 15.6.4는 503을 일시적 과부하나 예정된 점검으로 요청을 처리할 수 없고 일정 지연 뒤 해소될 것이라는 뜻으로 정의하고, 서버가 과부하 때 반드시 503을 써야 하는 것은 아니며 연결을 거절하는 서버도 있다고 한다. 10.2.3은 Retry-After 값이 HTTP-date 또는 0 이상 정수 초(delay-seconds)이며 503에서는 서비스가 쓰이지 못할 것으로 예상되는 시간을, 3xx에서는 리다이렉트 전 최소 대기 시간을 나타낸다고 한다.
(실험 확인) 위 블록은 Python 3.14 연습용 서버에 curl 8.7.1 로 요청해 헤더를 확인한 것이다. 상태 코드와 Retry-After 값은 내 서버가 정한 것이며 실제 서비스의 속도 제한 동작을 검증한 것은 아니다.
