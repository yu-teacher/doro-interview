---
slug: "rpc-06"
topic: "api-rpc"
tier: BASIC
difficulty: 1
title: "GraphQL이 REST의 오버페칭·언더페칭 문제를 어떻게 줄인다고 설명하나요?"
keywords: ["선택 집합으로 필요한 필드만", "요청과 같은 모양의 응답", "한 요청으로 연관 데이터 순회", "필드별 인자", "서버 쪽 N+1 부담"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://spec.graphql.org/October2021/", "https://graphql.org/learn/queries/", "https://graphql.org/learn/performance/"]
concepts: [graphql, rest-design]
importance: 2
links: [{to: "rpc-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
GraphQL 쿼리는 필요한 필드를 선택 집합으로 직접 지정하고, 응답은 그 요청과 같은 모양으로 돌아오기 때문에 필요 이상의 필드를 받는 오버페칭을 줄입니다. 또 연관 객체를 따라가며 한 요청으로 관련 데이터를 가져올 수 있어서, 데이터가 흩어져 있어 요청을 여러 번 보내야 하는 언더페칭도 줄입니다. 필드마다 인자를 줄 수 있다는 점도 도움이 됩니다. 다만 공짜는 아니어서, 서버가 필드별로 데이터를 가져오다 보면 N+1 같은 문제가 생길 수 있고 이 부담은 서버 쪽에서 해결해야 합니다.

(공식 문서) GraphQL 스펙(2021년 10월판 2.4 Selection Sets)은 연산이 필요한 정보의 집합을 선택하고 정확히 그 정보만 받아 오버페칭과 언더페칭을 피한다고 서술한다. Queries 페이지는 연관 객체를 따라가며 한 요청으로 많은 관련 데이터를 가져와 클래식한 REST에서 필요한 여러 번의 왕복을 줄일 수 있다고 하고, 중첩된 모든 필드가 자기 인자를 가질 수 있다고 설명한다.
(공식 문서) Performance 페이지는 순진한 구현이 데이터 소스를 반복 호출하는 N+1 문제를 겪을 수 있다고 한다.
