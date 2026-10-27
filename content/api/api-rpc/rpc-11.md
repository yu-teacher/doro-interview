---
slug: "rpc-11"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "gRPC 상태 코드는 HTTP 상태 코드와 어떻게 다르고, `UNAVAILABLE`·`ABORTED`·`FAILED_PRECONDITION` 중 무엇을 반환해야 하나요?"
keywords: ["정수 코드와 메시지", "트레일러로 전달", "UNAVAILABLE은 같은 호출 재시도", "ABORTED는 상위 단계 재시도", "FAILED_PRECONDITION은 상태 수정 전 재시도 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/guides/status-codes/", "https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md", "https://grpc.io/docs/guides/retry/", "https://grpc.io/docs/guides/error/"]
concepts: [grpc-protobuf, http-status-error]
importance: 2
links: [{to: "rpc-17", kind: FOLLOWUP}, {to: "apd-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
gRPC는 모든 호출이 정수 코드와 문자열 메시지로 이뤄진 상태로 끝나며, 0번 `OK` 부터 16번 `UNAUTHENTICATED` 까지 정의된 코드를 씁니다. 상태는 응답 끝의 트레일러로 전달되고, 오류 응답도 HTTP 레벨에서는 200을 쓴다고 프로토콜 문서가 설명합니다. 실패 코드는 재시도 방법을 기준으로 고릅니다. 같은 호출만 다시 보내도 되면 `UNAVAILABLE`, 읽고 수정하고 쓰는 시퀀스를 처음부터 다시 해야 하면 `ABORTED`, 시스템 상태가 고쳐지기 전에는 재시도하면 안 되면 `FAILED_PRECONDITION` 입니다. 입력 자체가 잘못이면 `INVALID_ARGUMENT` 입니다.

(공식 문서) Status Codes 가이드는 모든 RPC가 정수 코드와 문자열 설명으로 이뤄진 상태를 클라이언트에 돌려주며, 응용은 정의된 값만 써야 한다고 한다. 코드는 `OK`(0)부터 `UNAUTHENTICATED`(16)까지이고, 서비스 구현자가 `FAILED_PRECONDITION`, `ABORTED`, `UNAVAILABLE` 중 고르는 가이드라인으로 (a) 실패한 호출만 재시도하면 되면 `UNAVAILABLE`, (b) 더 높은 수준에서 재시도해야 하면 `ABORTED`, (c) 상태가 고쳐지기 전에는 재시도하면 안 되면 `FAILED_PRECONDITION` 을 제시한다. `INVALID_ARGUMENT` 는 시스템 상태와 무관하게 문제인 인자에 쓴다고 구분한다.
(공식 문서) PROTOCOL-HTTP2 문서는 상태가 트레일러의 `grpc-status` 로 전달되고 성공일 때도 보낸다고 하며, content-type이 `application/grpc` 로 시작하지 않으면 서버가 415를 응답해 다른 HTTP/2 클라이언트가 gRPC 오류 응답(HTTP 200)을 성공으로 오해하지 않게 한다고 설명한다. 재시도 가이드는 재시도 정책의 재시도 대상 코드로 끝난 호출을 시도 횟수 한도 안에서 지수 백오프 뒤 새 호출로 재시도하며, 정책이 없어도 서버 로직에 닿지 않은 호출에 한해 투명 재시도가 있다고 한다. `UNAVAILABLE` 이 비멱등 연산에는 재시도가 안전하지 않을 수 있다는 단서는 Status Codes 가이드에 있다. Error handling 가이드는 오류 상세를 담는 확장 모델도 소개한다.
