---
slug: "net-02"
topic: "cs-network"
tier: BASIC
difficulty: 1
title: "TCP와 UDP의 차이는 무엇이고, 어떤 상황에 각각 쓰나요?"
keywords: ["연결을 먼저 맺고", "연결 없이 데이터그램", "전달, 순서, 중복 방지", "흐름 제어와 혼잡 제어", "DNS 질의", "실시간 음성·영상"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9293.html", "https://www.rfc-editor.org/rfc/rfc768.html", "https://www.rfc-editor.org/rfc/rfc8085.html", "https://www.rfc-editor.org/rfc/rfc1035.html", "https://book.systemsapproach.org/e2e/rtp.html"]
refs: ["Computer Networks: A Systems Approach, 5.4 Transport for Real-Time (RTP), 요구 사항 논의 (웹 판)"]
concepts: [tcp]
importance: 3
links: [{to: "net-03", kind: FOLLOWUP}, {to: "net-08", kind: FOLLOWUP}, {to: "web-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
TCP는 연결을 먼저 맺고 바이트 스트림을 순서대로, 유실 없이 전달해 주는 신뢰성 있는 프로토콜이며 흐름 제어와 혼잡 제어도 갖추고 있습니다. UDP는 연결 없이 데이터그램을 하나씩 보내는 최소한의 프로토콜이라 전달, 순서, 중복 방지를 보장하지 않지만 그만큼 오버헤드와 지연이 작습니다. 웹, 파일 전송, 메일처럼 빠짐없이 도착해야 하면 TCP를 쓰고, DNS 질의처럼 짧은 요청과 응답이나 실시간 음성·영상처럼 늦은 재전송이 오히려 쓸모없는 경우에는 UDP를 씁니다. 다만 UDP를 쓰는 애플리케이션은 신뢰성이 필요하면 직접 구현하고 혼잡 제어도 스스로 책임져야 합니다.

(공식 문서) RFC 9293 §2.2는 TCP가 신뢰성 있고 순서가 보장되는 바이트 스트림 서비스이며, 신뢰성은 순번으로 손실을 감지하고 체크섬으로 오류를 감지해 재전송으로 바로잡는 것이라고 설명한다. RFC 768은 UDP가 트랜잭션 지향이고 전달과 중복 방지를 보장하지 않으며, 순서 있는 신뢰성 스트림이 필요하면 TCP를 쓰라고 한다. 순서에 대해서는 RFC 8085 §3.3이 순서 보장이 필요한 애플리케이션이 직접 순서를 복원해야 한다(MUST)고 명시한다. TCP의 흐름 제어·혼잡 제어는 RFC 9293 §3.8.6(윈도우)과 §3.8.2(혼잡 제어 구현 MUST)에 근거한다. RFC 8085 §1은 UDP가 연결 설정·해제 오버헤드가 없고 자체 혼잡 제어가 없다고 하고, §3.3은 신뢰성이 필요하면 애플리케이션이 구현해야 한다고 하며, §3.1은 혼잡 제어 책임을 애플리케이션에 둔다. RFC 1035 §4.2.1은 DNS 표준 질의에 UDP를 권장한다(1987년 문서이고, 같은 절의 512바이트 제한 등은 이후 규격에서 달라졌을 수 있어 이 질문에서는 다루지 않는다).
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 TCP로 50 MiB 난수 데이터를 보내자 수신한 바이트 수와 sha256이 일치했다. 반대로 UDP로 1,004바이트 데이터그램 20,000개를 수신 측이 읽지 않는 동안 연달아 보내자 sendto는 오류 없이 모두 반환됐지만 수신된 것은 759개뿐이었다(수신 버퍼 786,896바이트). 받은 것의 순서는 유지됐다. 이는 수신 버퍼 초과로 인한 유실이며, 수치는 이 환경의 버퍼 크기에 의존한다.
(원저자 자료) Computer Networks: A Systems Approach 5.4(실시간 전송 RTP)는 지연 한도가 빡빡한 응용은 보통 TCP 같은 신뢰성 전송을 쓸 수 없다고 설명한다. 손실을 재전송으로 바로잡으면 그 패킷이 쓸모 있는 시점을 넘겨 도착하기 쉽기 때문이며, 그래서 응용이 빠진 패킷을 스스로 알아채 다뤄야 한다고 한다.
