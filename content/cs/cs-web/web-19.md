---
slug: "web-19"
topic: "cs-web"
tier: TRICKY
difficulty: 3
title: "콘텐츠 협상을 하는 응답에 Vary 헤더를 빼먹으면 캐시에서 어떤 문제가 생기나요?"
keywords: ["Accept 헤더로 표현 선택", "Vary는 캐시 키 확장", "Vary 누락 시 다른 표현 재사용", "406 Not Acceptable", "서버 주도 협상의 단점"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc9111.html"]
---
**모범 답변 (30~60초)**
콘텐츠 협상은 클라이언트가 Accept, Accept-Language, Accept-Encoding 같은 헤더로 선호를 보내면 서버가 맞는 표현을 골라 응답하는 방식입니다. 이때 Vary 헤더는 응답을 고르는 데 쓰인 요청 헤더 이름을 알려 주고, 캐시는 Vary에 적힌 헤더 값이 원래 요청과 같을 때만 그 저장본을 재사용하므로 사실상 캐시 키를 넓혀 줍니다. Vary를 빼먹으면 캐시가 같은 URL이라는 이유만으로 JSON용으로 만든 응답을 HTML을 원하는 요청에도 내주는 식으로 잘못된 표현이 재사용됩니다. 맞는 표현이 없으면 406이나 기본 표현을 보낼 수 있고, 표준은 서버 주도 협상이 공유 캐시 재사용을 제한한다는 단점도 적고 있습니다.

```
Cache-Control: max-age=60, Accept 로 표현을 고르는 응답, 같은 URL 을 Accept 를 바꿔 2번 요청 (Chromium 156)
Vary: Accept 있음 : JSON-VERSION, HTML-VERSION   (서버에 2건 도착)
Vary 없음         : JSON-VERSION, JSON-VERSION   (서버에 1건 도착, 두 번째가 캐시에서 잘못 재사용됨)
curl -H 'Accept: image/png' -> 406 Not Acceptable   (내 서버가 정한 응답)
```

(공식 문서) RFC 9110 12.1은 서버 주도(proactive) 협상을 설명하며 단점으로 서버가 사용자에게 "최선"을 정확히 알 수 없고, 요청마다 능력을 보내는 비용과 프라이버시 위험이 있고, 서버 구현이 복잡해지고, 공유 캐시에서 응답 재사용성을 제한한다는 점을 든다. 협상에 쓰이는 헤더는 Accept, Accept-Charset, Accept-Encoding, Accept-Language다. 12.5.5는 Vary가 응답 선택에 영향을 준 요청 헤더를 알려 주며, 캐시 수신자에게는 나열된 헤더 값이 같을 때만 재사용하라는 뜻이어서 Vary가 캐시 키를 확장한다고 한다. 15.5.7은 406이 협상 헤더에 맞는 표현이 없고 서버가 기본 표현을 주지 않을 때의 응답이라고 한다. RFC 9111 4.1은 Vary에 나열된 헤더가 일치하지 않으면 재검증 없이 저장 응답을 쓰면 안 된다고 하고, 일부 리소스가 기본 응답에서 Vary 를 실수로 빠뜨려 더 알맞은 응답이 있어도 그 응답이 후속 요청에 선택되는 효과가 생긴다고 직접 언급한다.
(실험 확인) 위 블록은 Playwright 1.64.1 번들 Chromium 156.0.8078.4 헤드리스로 로컬 Node 서버에 대해 얻은 결과다.
