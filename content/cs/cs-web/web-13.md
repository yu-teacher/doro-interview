---
slug: "web-13"
topic: "cs-web"
tier: DEEP
difficulty: 3
title: "HTTP/3 는 왜 TCP 가 아니라 QUIC 위에서 동작하나요?"
keywords: ["UDP 위의 QUIC", "스트림 단위 신뢰성", "TCP HOL 블로킹 제거", "TLS 1.3 통합", "Alt-Svc로 발견하고 TCP로 폴백"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9114.html", "https://www.rfc-editor.org/rfc/rfc9000.html", "https://www.rfc-editor.org/rfc/rfc9204.html"]
---
**모범 답변 (30~60초)**
HTTP/2는 멀티플렉싱을 해도 TCP 한 연결 위에서 도니까, 패킷이 하나 유실되거나 순서가 바뀌면 그 연결의 모든 스트림이 함께 멈춥니다. HTTP/3은 같은 HTTP 의미를 QUIC 위에 올렸습니다. QUIC은 UDP 데이터그램에 실려 가면서 스트림 다중화와 스트림별 흐름 제어, 신뢰성을 자체적으로 제공하므로, 패킷이 유실돼도 그 패킷에 데이터가 들어 있던 스트림만 재전송을 기다리고 나머지는 계속 진행됩니다. QUIC은 TLS 1.3 핸드셰이크를 통합해서 연결 설정 지연이 줄고, 0-RTT로 데이터를 일찍 보내는 옵션도 있습니다. 클라이언트는 Alt-Svc 같은 광고로 h3 지원을 알게 되고, UDP가 막혀 연결이 실패하면 TCP 기반 HTTP를 시도하도록 권고됩니다.

(공식 문서) RFC 9114 1.1은 HTTP/2의 병렬성이 TCP의 손실 복구에 보이지 않아 유실이나 재정렬된 패킷 하나가 영향받지 않는 트랜잭션까지 모두 멈추게 한다고 설명하고, 1.2는 QUIC이 스트림 다중화와 스트림별 흐름 제어를 갖고 신뢰성을 스트림 단위로, 혼잡 제어를 연결 전체로 제공하며 TLS 1.3을 전송 계층에 포함해 TCP Fast Open 수준으로 개선된 연결 설정 지연을 제공한다고 한다. RFC 9000 1절은 QUIC이 UDP 데이터그램에 실리고, 핸드셰이크가 TLS를 통합하며 0-RTT 옵션이 있고 연결 마이그레이션을 지원한다고 한다. 13절(Packetization and Reliability)은 QUIC이 스트림 간 HOL 블로킹을 피하지만 여러 스트림의 데이터가 한 패킷에 든 경우 그 패킷이 유실되면 그 스트림들이 모두 막힌다고 단서를 단다. RFC 9114 3.1은 TLS 핸드셰이크의 ALPN 토큰이 "h3"이고 UDP 차단 등으로 QUIC 연결이 실패하면 클라이언트가 TCP 기반 HTTP를 시도해야(SHOULD) 한다고 하며, 3.1.1은 Alt-Svc 헤더나 ALTSVC 프레임으로 h3 엔드포인트를 광고할 수 있다고 한다. RFC 9204 1절은 HPACK을 그대로 쓰면 스트림 간 전체 순서 가정 때문에 HOL 블로킹이 생겨 HTTP/3은 비순서 전달을 고려한 QPACK을 쓴다고 한다. 이 질문은 로컬에 HTTP/3 서버와 클라이언트가 없어 실행 실험 없이 RFC 문장만으로 근거를 댄다.
