---
slug: "net-03"
topic: "cs-network"
tier: BASIC
difficulty: 1
title: "TCP 3-way 핸드셰이크는 어떻게 진행되고, 왜 두 번이 아니라 세 번 주고받나요?"
keywords: ["SYN과 ACK를 한 세그먼트에", "초기 순번", "오래된 중복 SYN", "RST로 거부", "ESTABLISHED"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9293.html"]
concepts: [tcp]
importance: 3
links: [{to: "net-04", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
클라이언트가 SYN을 보내며 자기 초기 순번을 알리고, 서버가 SYN과 ACK를 한 세그먼트에 담아 자기 초기 순번과 함께 응답하고, 클라이언트가 그 SYN을 확인하는 ACK를 보내면 양쪽이 ESTABLISHED 상태가 됩니다. 원래는 양방향 각각 SYN과 ACK로 네 번이 필요한데 서버의 ACK와 SYN을 합쳐서 세 번이 됩니다. 순번이 전역 시계에 묶여 있지 않아서 받는 쪽은 SYN이 오래된 것인지 알 수 없고, 그래서 상대에게 확인을 받아야 오래된 중복 SYN이 새 연결로 오인되는 것을 막을 수 있습니다. 오래된 SYN에 서버가 응답해도 클라이언트가 RST로 거부해 서버는 대기 상태로 돌아갑니다. 연결 설정은 커널이 처리하므로 accept를 호출하기 전에도 클라이언트의 connect는 성공할 수 있습니다.

(공식 문서) RFC 9293 §3.5는 3-way 핸드셰이크의 기본 흐름(Figure 6: SYN → SYN,ACK → ACK)을 보이고, 3-way의 주된 이유가 오래된 중복 연결 시작으로 인한 혼란 방지라고 한다. Figure 8은 오래된 중복 SYN에 대해 서버가 SYN,ACK를 보내면 클라이언트가 ACK 필드가 틀렸음을 알아채고 RST로 응답해 서버가 LISTEN으로 돌아가는 복구를 보인다. §3.4.1은 두 쪽이 각자의 초기 순번(ISN)을 보내고 상대의 확인을 받아야 하며 4단계 중 2·3단계를 합쳐 3-way가 된다고 설명하고, 순번이 네트워크의 전역 시계에 묶여 있지 않기 때문이라고 한다. ISN은 32비트 값이고 4μs 단위 시계에 연결 정보와 비밀 키에서 계산한 의사난수를 더하도록 권고(SHOULD)한다. SYN과 FIN은 순번을 하나씩 차지하고(§3.4 SEG.LEN은 SYN·FIN을 센다, Figure 6의 SEQ=100 SYN에 ACK=101) ACK 번호는 다음에 기대하는 순번이다(§3.1).
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 listen(backlog=1)만 하고 accept를 부르지 않은 서버에 connect하자 수 ms(재실행에서 4.4 ms) 만에 성공했고, netstat에는 양쪽 소켓이 모두 ESTABLISHED로 나왔다. 먼저 보낸 데이터는 이후 accept 뒤 recv로 그대로 읽혔다. 리스너가 없는 포트로 connect하면 즉시 ConnectionRefusedError였다(RST로 거부된 것으로 해석되며 패킷은 캡처하지 않았다). accept 큐의 정확한 동작은 OS마다 달라서 macOS 결과로만 적는다.
(보충) accept 호출 전에도 connect가 성공한다는 서술은 소켓 API와 OS 구현의 동작이라 RFC 9293 본문에 없고 macOS 실험으로만 확인했다. Linux 동작은 man-pages를 읽지 않아 단정하지 않는다.
