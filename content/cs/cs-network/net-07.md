---
slug: "net-07"
topic: "cs-network"
tier: BASIC
difficulty: 1
title: "포트와 소켓은 무엇이고, 서버 하나의 포트로 어떻게 많은 클라이언트와 동시에 통신하나요?"
keywords: ["16비트 번호", "IP 주소와 포트를 합친", "양쪽 소켓의 쌍", "0~1023", "49152 이상"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9293.html", "https://www.rfc-editor.org/rfc/rfc6335.html", "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml", "https://book.systemsapproach.org/foundation/software.html"]
refs: ["Computer Networks: A Systems Approach, 1.4.1 Socket API (웹 판)"]
concepts: [network-layers, tcp]
importance: 2
links: [{to: "osm-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
포트는 한 호스트 안에서 어느 응용 서비스로 보낼지 구분하는 16비트 번호이고, TCP와 UDP가 각각 따로 가집니다. 소켓은 IP 주소와 포트를 합친 통신 끝점이고, TCP 연결은 양쪽 소켓의 쌍, 즉 출발지 IP·포트와 목적지 IP·포트로 식별됩니다. 그래서 서버가 80번 포트 하나에서 대기해도 클라이언트마다 IP나 출발지 포트가 달라 연결이 서로 구분되고, accept가 돌려주는 연결 소켓은 서버 포트가 같아도 서로 다른 연결입니다. 포트는 0~1023 시스템(Well-known), 1024~49151 사용자(등록), 49152 이상 동적(임시) 포트로 나뉘고 클라이언트의 출발지 포트는 보통 이 임시 범위에서 정해지는데, 실제 범위는 OS 설정에 따라 다릅니다(RFC 6335는 범위를 정의할 뿐 클라이언트가 그 범위에서 고른다고 규정하지는 않습니다).

(공식 문서) RFC 9293 §2.2는 TCP가 포트 번호로 응용 서비스를 식별하고 흐름을 다중화한다고 하고, §3.1 헤더의 포트 필드는 16비트다. 용어집은 소켓을 'IP 주소와 TCP 포트를 이은 주소', 연결을 '소켓 쌍으로 식별되는 논리적 통신 경로'로 정의하고 §3.4.1도 연결이 소켓 쌍으로 정의된다고 한다. RFC 6335 §6은 포트 번호 범위를 System(0-1023), User(1024-49151), Dynamic/Ephemeral(49152-65535)로 나눈다. IANA 서비스 이름·포트 레지스트리(같은 사이트의 CSV 본으로 확인)에는 domain=53, http=80이 tcp와 udp 양쪽에 각각 등록되어 있다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 리스닝 포트 하나에 클라이언트 3개를 연결하자 서버 측 accept 소켓의 로컬 포트는 모두 같았고 상대 포트만 서로 다른 임시 포트(재실행에서 52527, 52528, 52529)였다. 같은 IP·포트에 두 번째 listen은 Address already in use로 실패했다. 같은 번호를 UDP 소켓은 bind할 수 있어서 TCP와 UDP의 포트 공간은 분리되어 있었다. 이 Mac의 동적 포트 범위(sysctl net.inet.ip.portrange)는 49152~65535로 RFC 6335와 같았다.
(원저자 자료) Computer Networks: A Systems Approach 1.4.1은 서버가 socket·bind·listen 뒤에 accept로 수동 열기를 수행하며, accept는 연결이 성립할 때까지 막혔다가 방금 성립한 연결에 해당하는 새 소켓을 돌려주고 원래 소켓은 이후 accept를 위해 그대로 남는다고 설명한다. 연결마다 새 소켓이 생긴다는 서술을 이 책이 뒷받침한다.
(보충) 클라이언트 임시 포트를 실제로 어느 범위에서 고르는지는 OS 설정이며 RFC 6335의 동적 범위와 다를 수 있다(Linux 값은 근거를 읽지 않아 적지 않는다).
