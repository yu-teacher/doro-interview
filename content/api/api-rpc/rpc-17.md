---
slug: "rpc-17"
topic: "api-rpc"
tier: TRICKY
difficulty: 3
title: "gRPC 호출이 서버에서는 성공으로 끝났는데 클라이언트에서는 실패로 보일 수 있나요? 그럴 때 주의할 점은 무엇인가요?"
keywords: ["클라이언트와 서버의 독립 판단", "데드라인 뒤 응답 도착", "완료됐어도 DEADLINE_EXCEEDED", "취소해도 롤백 안 됨", "쓰기는 멱등하게"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/what-is-grpc/core-concepts/", "https://grpc.io/docs/guides/status-codes/", "https://grpc.io/docs/guides/retry/", "https://grpc.io/docs/guides/deadlines/"]
concepts: [grpc-protobuf, idempotency]
importance: 1
links: [{to: "rpc-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
네, 가능합니다. gRPC에서는 클라이언트와 서버가 각자 독립적으로 호출의 성공 여부를 판단하기 때문에 결론이 다를 수 있습니다. 서버는 응답을 모두 보냈다고 판단했는데 그 응답이 데드라인 뒤에 도착해 클라이언트는 `DEADLINE_EXCEEDED` 로 실패 처리하는 경우가 대표적입니다. 상태를 바꾸는 연산은 실제로 완료됐는데도 이 오류가 나올 수 있다고 공식 문서가 밝힙니다. 또 취소 전에 일어난 변경은 롤백되지 않습니다. 그래서 타임아웃 뒤 재시도하는 쓰기 호출은 멱등하게 설계하거나 결과를 조회해 확인해야 합니다.

(공식 문서) 핵심 개념 페이지의 RPC termination 절은 클라이언트와 서버가 독립적이고 로컬하게 성공 여부를 판단해 결론이 다를 수 있다고 하며, 서버는 모든 응답을 보냈다고 보지만 클라이언트는 응답이 데드라인 뒤에 도착했다고 보는 예를 든다. 취소는 즉시 종료시키지만 취소 전에 이뤄진 변경은 롤백되지 않는다고 경고한다.
(공식 문서) Status Codes 가이드는 `DEADLINE_EXCEEDED` 가 상태를 바꾸는 연산에서는 연산이 성공적으로 끝났어도 반환될 수 있다고 설명하고, `UNAVAILABLE` 설명에서 비멱등 연산의 재시도가 항상 안전하지는 않다고 한다. 재시도 가이드도 어떤 실패 연산이 재시도에 적합한지 애플리케이션이 이해해야 한다고 한다.
(보충) 멱등 키 설계나 결과 조회 확인은 일반적인 대응 방법이며 gRPC 문서가 규정한 절차는 아니다. 실제 호출로 실험하지는 않았다.
