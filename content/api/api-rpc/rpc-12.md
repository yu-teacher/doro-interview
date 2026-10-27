---
slug: "rpc-12"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "브라우저에서 gRPC 서버를 직접 호출하기 어렵다고 하는데, gRPC-Web은 이를 어떻게 해결하나요?"
keywords: ["브라우저는 HTTP/2 프레이밍 미노출", "gRPC-Web 별도 프로토콜", "트레일러를 본문에 인코딩", "Envoy 같은 프록시 변환", "proto로 웹 클라이언트 생성"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md", "https://github.com/grpc/grpc-web", "https://grpc.io/docs/platforms/web/basics/", "https://grpc.io/blog/grpc-web-ga/", "https://grpc.io/docs/what-is-grpc/faq/"]
concepts: [grpc-protobuf, http-protocol]
importance: 1
links: [{to: "rpc-07", kind: PREREQ}, {to: "web-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
공식 gRPC-Web 프로토콜 문서는 브라우저의 한계 때문에 웹 클라이언트 라이브러리가 네이티브 gRPC와 다른 프로토콜을 쓴다고 설명합니다. 브라우저는 HTTP/2 프레이밍을 직접 노출하지 않으므로 gRPC-Web은 HTTP/2 전용 요소에 의존하지 않게 설계됐고, 상태 같은 트레일러를 응답 본문 안에 인코딩합니다. 그래서 브라우저와 gRPC 백엔드 사이에 프로토콜을 변환하는 프록시를 두는 배포가 가장 유력하다고 보며, 공식 튜토리얼은 Envoy의 `grpc_web` 필터를 쓰고 NGINX도 지원된다고 합니다. 이렇게 하면 `.proto` 하나로 브라우저용 클라이언트 코드까지 생성할 수 있습니다.

(원저자 자료) gRPC 프로젝트의 PROTOCOL-WEB 문서는 브라우저 제약 때문에 네이티브 프로토콜과 다른 프로토콜을 쓴다고 하고, 설계 목표로 HTTP/2 프레이밍과의 분리(브라우저가 직접 노출하지 않으며 앞으로도 그렇다는 서술), 텍스트 스트림(base64) 지원을 든다. 응답 상태는 본문에 인코딩되고 첫 프레임 바이트의 최상위 비트로 트레일러를 구분하며, 프록시가 두 프로토콜을 변환하는 배포 모델을 가장 유력하다고 서술한다. 같은 문서는 브라우저가 새 스트림 API로 네이티브 프로토콜을 말할 수 있게 되면 이 프로토콜이 선택 사항이 될 것으로 기대한다고 쓰지만, 그 현재 상태는 이번에 확인하지 못했다.
(공식 문서) Web 기본 튜토리얼은 Envoy 프록시가 브라우저 gRPC 요청을 백엔드로 전달하도록 `envoy.grpc_web` 필터를 설정하고 CORS 설정이 필요할 수 있다고 하며, `.proto` 에서 protoc 플러그인으로 웹 클라이언트 스텁을 생성한다. GA 발표 글(2018)은 Envoy가 기본 프록시이고 NGINX도 지원된다고 한다. FAQ는 gRPC-Web이 GA라고 한다.
(원저자 자료) gRPC-Web 저장소 README(2026-10-27 확인)는 현재 단항 RPC와 서버 스트리밍(`grpcwebtext` 모드에서만)을 지원하고 클라이언트·양방향 스트리밍은 아직 지원하지 않는다고 하며, 기본 프록시를 Envoy로 소개한다. 프록시와 브라우저를 실행하는 실험은 하지 않았다.
