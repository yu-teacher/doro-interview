---
slug: "rpc-10"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "gRPC에서 데드라인(타임아웃)은 왜 항상 설정해야 하고, 서버와 하위 호출에는 어떻게 전달되나요?"
keywords: ["기본은 데드라인 없음", "DEADLINE_EXCEEDED", "서버 자동 취소", "남은 시간 전파", "타임아웃으로 변환"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/guides/deadlines/", "https://grpc.io/docs/guides/cancellation/", "https://grpc.io/docs/what-is-grpc/core-concepts/", "https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md"]
concepts: [grpc-protobuf, resilience]
importance: 2
links: [{to: "rpc-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
데드라인은 클라이언트가 응답을 기다려 줄 수 있는 마지막 시각입니다. gRPC는 기본적으로 데드라인을 설정하지 않아서 클라이언트가 사실상 무한정 기다릴 수 있으므로, 현실적인 값을 항상 명시하라고 안내합니다. 시간이 지나면 클라이언트는 `DEADLINE_EXCEEDED` 로 호출을 실패시키고, 서버는 호출을 자동으로 취소합니다. 다만 서버가 시작한 작업은 애플리케이션이 직접 멈춰야 해서 취소 여부를 주기적으로 확인해야 합니다. 서버가 다른 서버를 호출할 때 남은 시간은 일부 구현(자바·Go 기본)이 자동 전파하고, 시계 차이를 피하려고 이미 지난 시간을 뺀 타임아웃으로 바꿔 보냅니다.

(공식 문서) Deadlines 가이드는 gRPC가 기본으로 데드라인을 설정하지 않아 클라이언트가 사실상 영원히 기다릴 수 있으므로 항상 현실적인 값을 명시하라고 하고, 초과하면 클라이언트가 `DEADLINE_EXCEEDED` 로 실패시킨다고 한다. 서버는 데드라인이 지나면 호출을 자동으로 취소(`CANCELLED`)하지만 서버가 만든 작업을 멈추는 것은 애플리케이션 책임이라고 한다. 전파는 일부 구현에서 자동이며 자바와 Go는 기본으로 켜져 있고 C++은 명시적으로 켜야 한다고 하며, 시계 불일치를 피하려고 경과 시간을 뺀 타임아웃으로 변환한다고 한다.
(공식 문서) Cancellation 가이드는 취소가 이상적으로는 상위 서버로 전파돼야 하고 gRPC 라이브러리에는 핸들러를 중단시키는 일반 메커니즘이 없어 핸들러가 주기적으로 취소 여부를 확인해야 한다고 한다. PROTOCOL-HTTP2 문서는 타임아웃이 `grpc-timeout` 헤더로 전달되며 생략되면 서버가 무한 타임아웃을 가정해야 한다(should)고 한다. 실제 호출로 실험하지는 않았다.
