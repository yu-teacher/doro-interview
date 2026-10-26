---
slug: "rpc-14"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "GraphQL은 REST와 달리 HTTP 캐싱이 어렵다고 하는데, 왜 그렇고 어떻게 보완하나요?"
keywords: ["URL 같은 전역 식별자 없음", "전역 고유 id 노출", "조회는 GET으로", "URL 길이 제한", "persisted query"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://graphql.org/learn/caching/", "https://graphql.org/learn/serving-over-http/", "https://graphql.org/learn/performance/", "https://graphql.org/learn/security/"]
concepts: [graphql, cache]
importance: 2
links: [{to: "rst-17", kind: RELATED}, {to: "web-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
REST는 URL이 리소스의 전역 고유 식별자라서 HTTP 캐시와 클라이언트 캐시가 이 URL을 키로 쓸 수 있습니다. GraphQL은 보통 단일 엔드포인트로 요청하고 클라이언트마다 필드 조합이 달라서 그런 URL 기반 식별이 없습니다. 보완책으로 먼저 객체에 전역 고유 `id` 를 노출해 클라이언트 캐시가 객체를 식별하게 합니다. 조회 연산은 GET으로 보내 HTTP 캐시와 CDN을 활용할 수 있고, URL 길이 제한 때문에 긴 쿼리는 해시 ID만 보내는 persisted query로 줄입니다. 공식 자료는 파라미터화된 요청이 가능한 API라면 GraphQL도 REST만큼 캐시할 수 있다고 봅니다.

(공식 문서) Caching 페이지는 엔드포인트 기반 API에서는 URL이 전역 고유 식별자라 클라이언트가 캐시를 만들 수 있지만 GraphQL에는 그런 URL 같은 요소가 없어, 객체 식별자(예: 전역 고유 `id`)를 노출하는 것이 특정 종류의 캐싱의 전제 모범 사례라고 한다. 클라이언트가 `__typename` 과 타입별 식별자를 조합해 직접 만들 수도 있다고 한다.
(공식 문서) Serving over HTTP 페이지는 GET이 쿼리 연산에만 쓸 수 있고 HTTP 캐시나 CDN 캐시에 유리하지만 브라우저와 CDN의 URL 길이 제한을 넘을 수 있어, persisted documents·자동 persisted queries·trusted documents로 짧은 문서 ID를 보내는 방법을 든다. Performance 페이지는 GraphQL이 파라미터화된 요청을 허용하는 API만큼 캐시 가능하다고 하며, 캐시 관련 응답 헤더를 제공할 때 GET이 효과적이라고 한다. Security 페이지는 HTTP 캐싱을 쓸 때 민감 데이터를 비공개로(또는 캐시하지 않게) 다루라고 한다.
