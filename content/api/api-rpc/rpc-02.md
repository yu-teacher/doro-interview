---
slug: "rpc-02"
topic: "api-rpc"
tier: BASIC
difficulty: 1
title: "gRPC의 네 가지 호출 유형(단항, 서버 스트리밍, 클라이언트 스트리밍, 양방향 스트리밍)은 각각 어떻게 다르고 언제 쓰나요?"
keywords: ["단항 요청-응답", "서버 스트리밍", "클라이언트 스트리밍", "양방향 독립 스트림", "스트림 안의 순서 보장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/what-is-grpc/core-concepts/", "https://grpc.io/docs/guides/performance/"]
concepts: [grpc-protobuf]
importance: 2
links: [{to: "rpc-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
단항은 요청 하나에 응답 하나로 일반 함수 호출과 같습니다. 서버 스트리밍은 요청 하나에 응답 스트림이 돌아오고, 클라이언트 스트리밍은 클라이언트가 메시지를 계속 보낸 뒤 서버가 응답 하나를 돌려줍니다. 양방향 스트리밍은 두 스트림이 독립적이라 서로 원하는 순서로 읽고 쓸 수 있습니다. `.proto` 에서는 메시지 앞에 `stream` 키워드를 붙여 구분하고, 각 스트림 안에서 메시지 순서는 보장됩니다. 다만 스트림은 시작하면 부하 분산이 되지 않고 디버깅이 어려워서 이점이 클 때만 쓰라고 공식 성능 가이드가 안내합니다.

(공식 문서) 핵심 개념 페이지의 서비스 정의 절이 네 유형을 설명한다. 예시 시그니처는 `rpc LotsOfReplies(HelloRequest) returns (stream HelloResponse);` 형태이고, 서버·클라이언트 스트리밍에서 개별 RPC 안의 메시지 순서를 gRPC가 보장한다고 한다. 양방향은 두 스트림이 독립이라 번갈아 읽고 쓰는 방식도, 한쪽이 모두 받은 뒤 쓰는 방식도 가능하다고 한다.
(공식 문서) 성능 모범 사례 페이지는 스트림이 긴 논리적 데이터 흐름에는 RPC 시작 비용을 줄여 주지만, 시작된 스트림은 부하 분산이 불가능하고 실패 디버깅이 어려우며 작은 규모에서만 성능이 오를 수 있다고 하고, 실질적 이득이 있을 때만 쓰라고 안내한다.
