---
slug: "rpc-07"
topic: "api-rpc"
tier: BASIC
difficulty: 2
title: "REST와 gRPC는 어떻게 다르고, 어떤 상황에서 gRPC를 고르나요?"
keywords: ["정적 경로 메서드 호출", "자체 상태 코드", "양방향 스트리밍", "저지연 분산 시스템", "브라우저는 gRPC-Web 필요"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/what-is-grpc/faq/", "https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md", "https://grpc.io/blog/grpc-web-ga/"]
concepts: [grpc-protobuf, rest-design]
importance: 3
links: [{to: "rpc-01", kind: PREREQ}, {to: "rpc-12", kind: FOLLOWUP}, {to: "rst-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
REST는 리소스를 URL로 식별하고 HTTP 메서드와 상태 코드의 관례를 따르는 반면, gRPC는 `.proto` 로 정의한 메서드를 호출하는 RPC입니다. gRPC는 호출 디스패치 성능을 위해 정적인 경로를 쓰고 경로·쿼리·본문에서 인자를 파싱하는 비용을 피하며, HTTP 상태 코드 대신 API 용도에 맞게 정리한 자체 오류 코드를 씁니다. 완전한 양방향 스트리밍도 허용합니다. 공식 FAQ가 드는 주 용도는 낮은 지연과 높은 확장성이 필요한 분산 시스템, 모바일 클라이언트와 클라우드 서버 통신입니다. 브라우저에서 직접 쓰려면 gRPC-Web이 필요합니다.

(공식 문서) gRPC FAQ는 gRPC가 대체로 HTTP/2 위의 HTTP 의미를 따르되 완전한 양방향 스트리밍을 명시적으로 허용하고, 경로·쿼리·본문에서 호출 파라미터를 파싱하면 지연과 복잡도가 늘어 호출 디스패치에 정적 경로를 쓴다고 설명한다. 또 HTTP 상태 코드보다 API 용도에 더 맞는다고 보는 오류 집합을 따로 정리했다고 하고, 주요 사용 시나리오로 낮은 지연의 확장 가능한 분산 시스템, 모바일 클라이언트와 클라우드 서버 통신, 정확하고 효율적이며 언어 독립적인 프로토콜 설계를 든다. 브라우저에서는 gRPC-Web이 GA라고 한다.
(공식 문서) gRPC-Web 프로토콜 문서는 브라우저 제약 때문에 웹 클라이언트가 네이티브 gRPC와 다른 프로토콜을 쓴다고 한다.
(보충) REST를 리소스 URL과 HTTP 메서드 중심으로 요약한 부분은 FAQ가 직접 서술한 것이 아니라 일반적인 설명이다. FAQ가 REST와의 우열을 단정하는 것은 아니고 차이를 서술하는 범위이다. 공개 API나 브라우저 중심 서비스에서는 REST가 낫다는 판단은 일반적인 실무 견해이며 공식 근거는 아니다.
