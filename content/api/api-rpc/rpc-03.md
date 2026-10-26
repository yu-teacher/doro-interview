---
slug: "rpc-03"
topic: "api-rpc"
tier: BASIC
difficulty: 1
title: "프로토콜 버퍼(`.proto`)는 무엇이고, gRPC의 인터페이스 정의와 직렬화에 어떻게 쓰이나요?"
keywords: ["구조화된 데이터 직렬화", "proto 파일에 메시지 정의", "protoc 코드 생성", "필드 번호 기반 와이어", "service와 rpc 정의"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/what-is-grpc/introduction/", "https://protobuf.dev/programming-guides/encoding/", "https://protobuf.dev/programming-guides/proto3/"]
concepts: [grpc-protobuf]
importance: 3
links: [{to: "rpc-08", kind: FOLLOWUP}, {to: "rpc-09", kind: FOLLOWUP}, {to: "rpc-20", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
프로토콜 버퍼는 구조화된 데이터를 직렬화하는 구글의 오픈 소스 메커니즘입니다. `.proto` 텍스트 파일에 메시지와 필드를 정의하면 protoc 컴파일러가 각 언어의 데이터 접근 클래스를 생성하고, 그 클래스로 바이너리 직렬화와 파싱을 합니다. gRPC에서는 같은 파일에 `service` 와 `rpc` 메서드도 적어 요청과 응답 타입을 메시지로 지정합니다. 와이어에서는 필드 이름이 아니라 필드 번호와 타입 정보로 값을 구분해서 이름은 바이트에 실리지 않고, `.proto` 가 양쪽의 계약이 됩니다. gRPC 문서는 proto3 사용을 권장합니다.

(공식 문서) gRPC 소개 페이지는 프로토콜 버퍼를 구조화 데이터 직렬화 메커니즘으로 소개하고, 메시지가 이름-값 쌍인 필드의 집합이며 protoc가 접근자와 직렬화·파싱 메서드를 가진 클래스를 생성한다고 설명한다. gRPC와 함께 쓸 때는 proto3를 권장한다고 한다.
(공식 문서) Encoding 페이지는 메시지를 키-값 쌍의 연속으로 설명하고, 바이너리에서는 키로 필드 번호만 쓰이며 이름과 선언 타입은 디코딩하는 쪽이 `.proto` 정의를 참조해야 알 수 있다고 한다.
(실험 확인) protoc와 프로토콜 버퍼 라이브러리가 없어 문서의 인코딩 규칙만 손으로 구현한 최소 인코더(Python)로 확인했다. 필드 1에 문자열 `kim`을 넣은 바이트 `0a036b696d`에는 필드 이름이 들어 있지 않았다. 실제 라이브러리로 확인한 것은 아니다.
