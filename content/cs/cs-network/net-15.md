---
slug: "net-15"
topic: "cs-network"
tier: DEEP
difficulty: 2
title: "ping과 traceroute는 ICMP와 TTL을 어떻게 이용해 동작하나요?"
keywords: ["ICMP Echo Request", "Echo Reply", "TTL", "0이 되면", "Time Exceeded", "별표"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc792.html", "https://www.rfc-editor.org/rfc/rfc791.html", "https://www.rfc-editor.org/rfc/rfc1122.html", "https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml"]
concepts: [network-layers]
importance: 2
---
**모범 답변 (30~60초)**
ICMP는 IP 계층의 오류 보고와 진단에 쓰는 메시지 프로토콜입니다. ping은 ICMP Echo Request를 보내고, 상대가 같은 데이터를 담아 Echo Reply로 돌려주면 왕복 시간을 측정합니다. IP 헤더의 TTL은 라우터를 지날 때마다 줄어드는 수명 값이라 0이 되면 라우터가 패킷을 버리고 보낸 쪽에 Time Exceeded 메시지를 보낼 수 있습니다. traceroute는 TTL을 1, 2, 3으로 늘려 가며 패킷을 보내고 각 홉이 돌려주는 Time Exceeded의 송신 주소로 경로를 알아내며, 목적지에 닿으면 목적지의 응답으로 끝납니다. 라우터가 응답하지 않으면 그 홉은 별표로 보입니다.

(공식 문서) RFC 792는 ICMP가 IP를 신뢰성 있게 만들려는 것이 아니라 통신 환경의 문제를 피드백하는 용도이며 ICMP 메시지에 대한 ICMP 메시지는 보내지 않는다고 서술한다(RFC 1122 §3.2.2는 이를 'ICMP 오류 메시지에 대한 오류 메시지는 보내지 않는다(MUST NOT)'로 좁혀 쓴다). Echo(type 8)와 Echo Reply(type 0)는 받은 데이터를 그대로 돌려주고 식별자·순번으로 짝을 맞춘다. Time Exceeded(type 11, code 0)는 TTL 초과로, 게이트웨이는 TTL이 0인 데이터그램을 반드시 폐기해야 하고 보낸 쪽에 알리는 것은 선택(may)이다. Destination Unreachable(type 3)의 code 3은 포트 도달 불가(호스트가 보냄)다. RFC 791은 TTL이 라우터가 처리할 때마다 최소 1씩 줄고 0이 되면 폐기되어 데이터그램 수명의 상한을 정한다고 한다. IANA 프로토콜 번호에서 ICMP는 1이다.
(실험 확인) macOS 26.6.2 루프백에서 `ping -c 3 127.0.0.1`은 3개 모두 응답했고 응답의 ttl 값은 64였다. 송신 TTL을 지정하는 옵션(`-m`, macOS ping(8) 매뉴얼)으로 TTL 1을 주고 `ping -c 2 -m 1 127.0.0.1`을 실행해도 2개 모두 응답했다. `traceroute -n -m 5 127.0.0.1`은 1홉에서 곧바로 끝났다. 루프백에서는 TTL이 줄지 않아 중간 라우터의 Time Exceeded 응답은 재현하지 못했고, 외부 서버 접속이 금지되어 실제 경로 추적은 하지 않았다.
(보충) traceroute가 UDP나 ICMP 프로브를 쓰고 어떤 응답을 종료 조건으로 삼는지는 구현마다 다른 부분이다. 이번에는 macOS traceroute(8) 매뉴얼(로컬)만 읽었고, 기본 프로브가 UDP이고 -I로 ICMP Echo를 쓸 수 있다는 것, TTL을 1부터 올리다 port unreachable을 받으면 목적지에 닿은 것으로 본다는 것, 응답 없는 홉이 `* * *`로 표시된다는 것을 거기서 확인했다. 이는 RFC가 아닌 구현 문서이고 Linux 구현은 읽지 않았다. 위 설명은 RFC 792의 Time Exceeded와 port unreachable 정의와 함께 읽은 일반 설명이다.
