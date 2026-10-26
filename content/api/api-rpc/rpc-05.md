---
slug: "rpc-05"
topic: "api-rpc"
tier: BASIC
difficulty: 1
title: "GraphQL의 쿼리, 뮤테이션, 구독은 각각 무엇이 다른가요?"
keywords: ["쿼리는 읽기", "뮤테이션은 쓰기", "최상위 뮤테이션만 부수 효과", "구독은 실시간 장기 요청", "웹소켓 또는 SSE"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://graphql.org/learn/queries/", "https://graphql.org/learn/mutations/", "https://graphql.org/learn/subscriptions/"]
concepts: [graphql]
importance: 2
links: [{to: "rpc-04", kind: PREREQ}, {to: "rpc-18", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
세 가지 모두 GraphQL 연산 종류입니다. 쿼리는 데이터를 읽는 연산이고, 뮤테이션은 데이터를 쓰는 연산입니다. 스펙상 부수 효과가 허용되는 것은 최상위 뮤테이션 필드뿐이고, 한 요청에 뮤테이션 필드가 여러 개면 순서대로 실행됩니다. 구독은 서버가 변경을 계속 밀어 주는 장기 요청 연산이며 보통 웹소켓이나 서버 전송 이벤트로 구현하고, 한 구독 연산에는 루트 필드가 정확히 하나여야 합니다. 구독은 상태를 유지해야 해서 수평 확장이 더 어렵고, 변경이 드문 데이터에는 폴링이 나을 수 있습니다.

(공식 문서) Queries 페이지는 세 가지 주요 연산 종류를 소개한다. Mutations 페이지는 스펙이 최상위 뮤테이션 필드가 아닌 필드의 해석은 부수 효과가 없어야 하고 멱등이어야 한다고 정했음을 짚으며, 뮤테이션의 최상위 필드는 직렬로 실행된다고 설명한다.
(공식 문서) Subscriptions 페이지는 구독을 장기 요청으로 설명하고, 스펙이 전송 프로토콜을 정하지 않아 실제로는 웹소켓이나 서버 전송 이벤트가 자주 쓰인다고 한다. 구독 연산은 루트 필드가 정확히 하나여야 하고, 구독 클라이언트마다 서버 인스턴스에 묶여야 해서 수평 확장이 어렵다고 하며, 갱신이 드문 데이터에는 주기적 폴링·푸시 알림·재조회가 더 나을 수 있다고 한다.
