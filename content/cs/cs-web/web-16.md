---
slug: "web-16"
topic: "cs-web"
tier: TRICKY
difficulty: 3
title: "Cache-Control: no-cache 는 캐시하지 말라는 뜻인가요? no-store 와는 어떻게 다른가요?"
keywords: ["no-cache는 저장 허용", "재사용 전에 원 서버 검증", "no-store는 저장과 재사용 금지", "private은 공유 캐시 저장 금지", "must-revalidate는 stale 이후만"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9111.html"]
concepts: [cache, http-protocol]
importance: 2
---
**모범 답변 (30~60초)**
아닙니다. no-cache는 이름과 달리 저장을 막지 않고, 저장된 응답을 다른 요청에 재사용하기 전에 반드시 원 서버에 검증 요청을 보내 성공 응답을 받으라는 뜻입니다. ETag 같은 검증자가 있으면 바뀌지 않았을 때 304로 본문 전송을 아낄 수 있습니다. 저장 자체를 막으려면 no-store를 쓰는데, 캐시는 요청과 응답의 어떤 부분도 저장하면 안 되고 그 응답으로 다른 요청을 처리해서도 안 됩니다. 다만 표준은 no-store가 프라이버시를 보장하는 수단은 아니라고 적고 있습니다. private은 공유 캐시에는 저장하지 못하게 하고 브라우저 같은 개인 캐시는 저장해도 된다는 뜻입니다. must-revalidate는 stale이 된 뒤에만 재검증을 강제하므로 no-cache와 다릅니다.

```
Cache-Control 별로 같은 URL 을 fetch 3번, 서버에 도착한 요청 (Chromium 156)
max-age=60                : [full]                         (1건)
no-cache + ETag           : [full, conditional, conditional] (3건, 2번째부터 If-None-Match)
no-store                  : [full, full, full]               (3건, 매번 본문 전체)
```

(공식 문서) RFC 9111 5.2.2.4는 인자 없는 no-cache가 응답을 다른 요청에 쓰기 전에 검증을 위해 전달하고 성공 응답을 받아야 한다는 뜻이며, 오래된 응답 제공을 허용하도록 설정된 캐시에도 적용된다고 한다. 5.2.2.5는 no-store가 캐시가 요청과 응답의 어떤 부분도 저장하지 말고 이 응답으로 다른 요청을 처리하지도 말라는 뜻이고 개인 캐시와 공유 캐시 모두에 적용되며 신뢰할 수 있는 프라이버시 수단은 아니라고 하며, must-understand 가 특정 상황에서 no-store 를 덮어쓴다는 단서도 붙인다. no-cache 문장에는 저장 금지 문구가 없고 재사용 조건만 정한다. 5.2.2.7은 인자 없는 private이 공유 캐시의 저장을 막고 개인 캐시의 저장은 허용한다고 한다. 5.2.2.2는 must-revalidate가 응답이 stale이 된 뒤 원 서버 검증 성공 전에는 재사용하지 못하게 한다고 하며, 연결이 끊겼을 때 stale 응답을 재사용하지 말고 오류(보통 504)를 내야 한다고 한다.
(실험 확인) 위 블록은 Playwright 1.64.1 번들 Chromium 156.0.8078.4 헤드리스(첫 방문 직후, 같은 컨텍스트)의 한 번 측정이다. 브라우저의 구체적 캐시 구현에 따른 결과일 수 있다.
