---
slug: "rpc-04"
topic: "api-rpc"
tier: BASIC
difficulty: 1
title: "GraphQL은 무엇이고, 어떤 구성 요소로 동작하나요?"
keywords: ["API용 쿼리 언어", "타입 시스템과 스키마", "필드별 리졸버", "요청과 같은 모양의 응답", "단일 엔드포인트"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://graphql.org/learn/introduction/", "https://graphql.org/learn/serving-over-http/", "https://graphql.org/learn/response/", "https://spec.graphql.org/October2021/"]
concepts: [graphql]
importance: 3
links: [{to: "rpc-05", kind: FOLLOWUP}, {to: "rpc-06", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
GraphQL은 API를 위한 쿼리 언어이자, 개발자가 정의한 타입 시스템으로 그 쿼리를 실행하는 서버 측 런타임입니다. 서버는 스키마에 타입과 필드를 정의하고 필드마다 값을 가져오는 리졸버 함수를 작성합니다. 클라이언트가 필요한 필드를 골라 쿼리를 보내면 서버가 스키마에 맞는지 검증한 뒤 실행해서, 쿼리와 같은 모양의 결과를 돌려줍니다. 특정 데이터베이스에 묶여 있지 않고 기존 코드와 데이터 위에 얹으며, 보통 `/graphql` 같은 단일 엔드포인트로 제공합니다. 스펙은 전송 프로토콜과 직렬화 형식을 정해 두지 않습니다.

(공식 문서) GraphQL 학습 자료 Introduction은 GraphQL을 API를 위한 쿼리 언어이자 개발자가 정의한 타입 시스템으로 쿼리를 실행하는 서버 측 런타임이라고 정의하고, 2015년에 스펙이 오픈소스화됐으며 특정 데이터베이스나 저장소에 묶여 있지 않다고 한다. 서비스는 쿼리가 스키마에 정의된 타입과 필드만 가리키는지 확인한 뒤 함수를 실행한다고 설명한다.
(공식 문서) Serving over HTTP 페이지는 GraphQL 서버가 보통 `/graphql` 같은 단일 URL로 동작한다고 하고, Response 페이지는 스펙이 직렬화 형식이나 전송 프로토콜을 요구하지 않으며 보통 JSON과 HTTP를 쓴다고 한다. 스펙 소개는 타입 시스템을 GraphQL 언어 자체로 질의할 수 있는 점(인트로스펙션)도 특징으로 든다.
