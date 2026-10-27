---
slug: "net-01"
topic: "cs-network"
tier: BASIC
difficulty: 1
title: "OSI 7계층과 TCP/IP 4계층은 어떻게 다르고, 각 계층에서 실제로 쓰는 프로토콜은 무엇인가요?"
keywords: ["OSI 참조 모델", "응용, 전송, 인터넷, 링크", "프레젠테이션과 응용 기능", "TCP와 UDP", "헤더가 붙는 캡슐화"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc1122.html", "https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml", "https://book.systemsapproach.org/foundation/architecture.html"]
refs: ["Computer Networks: A Systems Approach, 1.3.2 Encapsulation·1.3.4 OSI Model·1.3.5 Internet Architecture (웹 판)", "Computer Networks: A Systems Approach, 1.3.5 Internet Architecture, 링크 계층의 하위 계층 서술 (웹 판)"]
concepts: [network-layers]
importance: 3
links: [{to: "net-02", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
OSI 참조 모델은 통신을 여러 계층으로 나눈 모델이고, 실제 인터넷은 TCP/IP 프로토콜 묶음을 쓰며 보통 응용, 전송, 인터넷, 링크의 4계층으로 설명합니다. TCP/IP에서는 OSI의 프레젠테이션과 응용 기능이 하나의 응용 계층으로 합쳐져 있습니다. 응용 계층에는 HTTP와 DNS 같은 프로토콜이, 전송 계층에는 TCP와 UDP가, 인터넷 계층에는 IP와 ICMP가 있고, 링크 계층은 바로 연결된 네트워크 안에서의 전달을 맡습니다. 데이터는 위 계층에서 아래로 내려갈 때 계층마다 헤더가 붙는 캡슐화를 거칩니다. 7계층 모델은 장애가 어느 층에서 났는지 말할 때 쓰는 공통 언어로 유용합니다.

(공식 문서) RFC 1122 §1.1.3은 인터넷 프로토콜 묶음을 응용·전송·인터넷·링크 4개 계층으로 설명한다. 응용 계층은 OSI 참조 모델의 프레젠테이션과 응용 두 계층의 기능을 합친 것이고, 사용자 프로토콜의 예로 Telnet·FTP·SMTP를, 지원 프로토콜의 예로 DNS 등을 든다. 전송 계층은 TCP(신뢰성 있는 연결형 서비스)와 UDP(비연결형 데이터그램 서비스), 인터넷 계층은 IP(비연결형, 전달 보장 없음)와 ICMP(IP 위에 얹히지만 IP의 일부로 간주)이며, 링크 계층은 직접 연결된 네트워크와 통신하는 프로토콜이라고 정의한다. IANA 프로토콜 번호 레지스트리는 ICMP=1, TCP=6, UDP=17로 등록하고 있다(2026-10-20 원문 확인).
(원저자 자료) Computer Networks: A Systems Approach 1.3.2는 각 계층이 위에서 받은 메시지를 내용을 해석하지 않은 채 본문(payload)으로 두고 앞에 자기 헤더를 붙이며(이것을 캡슐화라 부른다), 수신 쪽은 반대 순서로 헤더를 하나씩 해석해 떼어 올려 보낸다고 설명한다. 1.3.4는 OSI 7계층을 아래부터 물리·데이터 링크·네트워크·전송·세션·프레젠테이션·응용으로 설명하고, 하위 3계층은 스위치와 라우터를 포함한 모든 노드에 있고 전송 이상은 보통 종단 호스트에만 있다고 하며, 응용 계층의 예로 HTTP를 든다. 1.3.5는 인터넷의 응용 계층이 7계층, 전송이 4계층, IP가 3계층, 그 아래가 2계층에 해당한다고 대응시킨다.
(원저자 자료) 같은 1.3.5는 링크 아래의 이더넷이나 무선 프로토콜이 내부적으로 여러 하위 계층으로 이뤄질 수 있지만 인터넷 아키텍처는 그 구조를 전제하지 않는다고 덧붙인다.
(보충) 링크 계층을 물리와 데이터 링크로 나눠 5계층으로 가르치기도 한다는 서술 자체는 이 교과서 해당 절에서 확인하지 못했다. OSI 표준 문서 자체는 읽지 않았다.
