---
slug: "rst-09"
topic: "api-rest"
tier: BASIC
difficulty: 1
title: "API 에서 Accept 와 Content-Type 헤더는 각각 무엇이고, 406 과 415 는 언제 쓰나요?"
keywords: ["Content-Type은 보낸 본문 형식", "Accept는 받고 싶은 응답 형식", "q 값으로 선호도 표현", "지원 못 하는 요청 본문은 415", "원하는 표현이 없으면 406이지만 무시도 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc9457.html"]
concepts: [http-protocol]
importance: 2
links: [{to: "mvc-06", kind: RELATED}, {to: "mvc-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
`Content-Type`은 지금 보내는 본문이 어떤 형식인지, `Accept`는 클라이언트가 어떤 형식의 응답을 받고 싶은지를 알리는 헤더입니다. `Accept`에는 `application/json, text/plain;q=0.5`처럼 여러 형식과 `q` 가중치를 줄 수 있고, 더 구체적인 범위가 우선합니다. 서버가 요청 본문의 형식을 처리할 수 없으면 415 Unsupported Media Type, 요청한 형식으로 줄 표현이 없으면 406 Not Acceptable을 쓸 수 있습니다. 다만 표준은 서버가 406을 보내는 대신 기본 표현을 보내도 된다고 하므로, 클라이언트가 `Accept` 선호를 항상 지켜 줄 것이라고 믿으면 안 됩니다. 에러 응답에도 `Accept`의 선호가 적용됩니다.

```
POST /items  Content-Type: text/plain -> 415 Unsupported Media Type, accept: application/json
```

(공식 문서) RFC 9110 12.5.1은 `Accept`가 응답 미디어 타입에 대한 선호를 알리는 헤더이고 `q`로 상대적 가중치를 줄 수 있으며, 여러 범위가 겹치면 더 구체적인 범위가 우선한다고 한다. 12.1은 서버가 선호에 맞는 표현을 고르는 것을 사전 협상이라 하고 단점으로 서버가 최선을 정확히 알 수 없고 요청마다 능력을 알리는 비용과 사생활 위험이 있으며 공유 캐시 재사용을 제한한다고 적는다. 또 클라이언트는 선호가 항상 지켜진다고 기대할 수 없고, 서버는 406 대신 선호에 맞지 않는 응답을 보내는 편이 낫다고 판단할 수 있다고 한다. 선호는 오류나 처리 상태를 나타내는 표현을 포함해 응답의 모든 내용에 적용된다. 15.5.7은 406을 사전 협상 헤더에 맞는 현재 표현이 없고 서버가 기본 표현을 주려 하지 않는다는 뜻으로 정의한다. 15.5.16은 415를 요청 `Content-Type` 등 때문에 대상 리소스에서 이 메서드에 지원되지 않는 형식이라는 뜻으로 정의하고 지원하는 미디어 타입을 `Accept` 응답 헤더로 알릴 수 있다고 한다.
(공식 문서) RFC 9457 3절의 예시에서는 클라이언트가 `Accept`에 나열하지 않았는데도 서버가 `application/problem+json`으로 응답하며, 이는 HTTP가 허용하는 일이라고 설명한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 서버가 `Content-Type`이 JSON이 아니면 415를 내도록 구현한 것을 curl 8.7.1 로 확인한 결과다. 406 응답은 실험하지 않았다.
