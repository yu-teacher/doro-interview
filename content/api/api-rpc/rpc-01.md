---
slug: "rpc-01"
topic: "api-rpc"
tier: BASIC
difficulty: 1
title: "gRPC는 무엇이며 어떤 구성 요소로 이루어져 있나요?"
keywords: ["원격 메서드를 로컬처럼 호출", "프로토콜 버퍼 IDL", "스텁 코드 생성", "HTTP/2 위에서 전송", "채널과 메타데이터"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://grpc.io/docs/what-is-grpc/introduction/", "https://grpc.io/docs/what-is-grpc/core-concepts/", "https://grpc.io/docs/what-is-grpc/faq/", "https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md", "https://www.rfc-editor.org/rfc/rfc9113.html"]
concepts: [grpc-protobuf]
importance: 3
links: [{to: "rpc-02", kind: FOLLOWUP}, {to: "rpc-03", kind: FOLLOWUP}, {to: "rpc-07", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
gRPC는 클라이언트가 다른 머신의 서버 메서드를 로컬 객체의 메서드처럼 호출하게 해 주는 오픈 소스 RPC 프레임워크입니다. `.proto` 파일에 서비스와 메시지를 정의하는 것으로 시작하고, 기본적으로 프로토콜 버퍼가 인터페이스 정의 언어이자 직렬화 형식입니다. protoc 플러그인이 클라이언트 스텁과 서버 코드를 생성해 주기 때문에 자바 서버와 Go 클라이언트처럼 언어가 달라도 같은 계약으로 통신합니다. 전송은 HTTP/2 위에서 이뤄지고, 채널이 서버와의 연결을, 메타데이터가 호출별 부가 정보를 맡습니다.

(공식 문서) gRPC 소개 페이지는 클라이언트가 다른 머신의 서버 메서드를 로컬 객체처럼 호출한다고 설명하고, 서버는 인터페이스를 구현하며 클라이언트는 같은 메서드를 가진 스텁(언어에 따라 클라이언트)을 쓴다고 한다. 기본값은 프로토콜 버퍼이지만 JSON 같은 다른 형식도 쓸 수 있다고 한다. 핵심 개념 페이지는 채널을 특정 호스트·포트의 서버 연결로, 메타데이터를 호출에 딸린 키-값 목록으로 정의한다.
(공식 문서) FAQ는 gRPC가 와이어에서는 대체로 HTTP/2 위의 바이너리 데이터이지만, 흐름 제어 연동·연쇄 취소·로드 밸런싱 같은 상위 기능을 플랫폼 전반에 일관되게 제공하는 라이브러리 집합이라고 설명한다. PROTOCOL-HTTP2 문서의 호출 정의는 `:method POST`와 `content-type: application/grpc` 계열 헤더로 시작한다. RFC 9113 2절은 HTTP/2가 요청/응답 교환마다 별도 스트림을 두며 스트림은 서로 대체로 독립적이라 하나가 막혀도 다른 스트림이 진행된다고 설명한다.
