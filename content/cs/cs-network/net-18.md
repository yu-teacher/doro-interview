---
slug: "net-18"
topic: "cs-network"
tier: TRICKY
difficulty: 3
title: "Nagle 알고리즘과 지연 ACK는 각각 무엇이고, 함께 쓰이면 왜 지연이 생길 수 있나요?"
keywords: ["아직 ACK를 받지 못한 데이터", "지연 ACK", "0.5초 미만", "서로를 기다리는 지연", "TCP_NODELAY"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9293.html", "https://www.rfc-editor.org/rfc/rfc8085.html", "https://book.systemsapproach.org/e2e/tcp.html"]
refs: ["Computer Networks: A Systems Approach, 5.2.5 Triggering Transmission, Nagle’s Algorithm (웹 판)"]
concepts: [tcp]
importance: 1
links: [{to: "net-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
Nagle 알고리즘은 아직 ACK를 받지 못한 데이터가 있으면 작은 데이터를 바로 보내지 않고 모아 두었다가 ACK가 오거나 최대 크기 세그먼트가 채워질 때 보내서 작은 패킷이 넘치는 것을 막습니다. 지연 ACK는 수신 측이 세그먼트마다 ACK를 보내지 않고 잠시 기다렸다가 합쳐 보내는 것으로, 규격은 지연을 0.5초 미만으로 제한합니다. 송신자가 작은 쓰기를 연달아 하면 두 번째 조각이 첫 조각의 ACK를 기다리며 보류되고, 수신자는 ACK를 미루고 있어 서로를 기다리는 지연이 생길 수 있습니다. 지연에 민감한 애플리케이션은 연결별로 TCP_NODELAY를 켜서 Nagle을 끌 수 있고, 규격도 끌 방법을 제공하도록 요구합니다.

(공식 문서) RFC 9293 §3.7.4는 Nagle 알고리즘이 미확인 데이터가 있을 때 전송할 사용자 데이터를 모아 두었다가 확인되거나 최대 크기 세그먼트가 되면 보낸다고 하고, 구현하는 것이 권고(SHOULD)지만 연결별로 끌 방법이 반드시 있어야(MUST) 하며 Nagle과 지연 ACK 사이에 문제가 되는 상호작용이 있다고 인정한다. §3.8.6.3은 지연 ACK 구현이 권고(SHOULD)이고 지연은 0.5초 미만이어야 하며(MUST), 최소한 매 두 번째 full-sized 세그먼트(또는 2×RMSS 바이트)마다 ACK를 보낼 것을 권고하고 순서가 어긋난 세그먼트는 즉시 ACK하라고 한다. RFC 8085 §3은 Nagle을 끄면 지연이 줄고 대신 패킷이 더 자주(여전히 혼잡 제어 하에) 전송된다고 한다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 '작은 write 두 번(4바이트씩) 후 응답 read'를 20번 반복했다. 기본(Nagle 켬)에서 중앙값 0.07~0.08 ms, 최대 0.10~0.11 ms였고 TCP_NODELAY를 켜면 중앙값 0.04~0.06 ms, 최대 0.05~0.09 ms였다. 쓰기 패턴을 바꿔([1,1,1], [1,100], [10×5]바이트) 200번씩 반복한 재실험에서도 최대 0.17 ms 이하였고, 4+4바이트에서만 Nagle 켬이 중앙값 0.066 ms로 NODELAY(0.017 ms)보다 느렸다. 즉 이 환경에서는 두 알고리즘 상호작용으로 인한 ms 단위의 눈에 띄는 지연이 재현되지 않았다(macOS의 net.inet.tcp.delayed_ack 값은 3). 지연이 나타나는지는 OS의 지연 ACK 구현과 경로에 달려 있다는 뜻이며 지연 크기를 단정하지 않는다.
(원저자 자료) Computer Networks: A Systems Approach 5.2.5는 Nagle 알고리즘 때문에 한 바이트씩 쓰는 대화형 응용이 RTT당 한 세그먼트 속도로 보내게 되므로, 소켓 인터페이스가 응용이 TCP_NODELAY 옵션으로 이 알고리즘을 끌 수 있게 한다고 설명한다. 옵션 이름이 TCP_NODELAY인 점은 이 책이 뒷받침하며 RFC 9293은 연결별로 끌 수단만 요구한다.
