---
slug: "net-04"
topic: "cs-network"
tier: BASIC
difficulty: 2
title: "TCP 연결 종료(4-way)는 어떻게 이루어지고, 한쪽이 FIN을 보낸 뒤에도 데이터를 받을 수 있는 이유는 무엇인가요?"
keywords: ["FIN을 보내고", "반닫힘", "TIME_WAIT", "CLOSE_WAIT", "close 누락"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9293.html"]
---
**모범 답변 (30~60초)**
TCP는 두 방향을 따로 닫습니다. 한쪽이 더 보낼 데이터가 없으면 FIN을 보내고 상대가 ACK로 확인하는데, 이 시점부터는 그 방향만 닫힌 반닫힘 상태라 FIN을 보낸 쪽도 상대가 보내는 데이터를 계속 받을 수 있습니다. 상대도 보낼 것을 다 보내면 자기 FIN을 보내고, 먼저 닫은 쪽이 마지막 ACK를 보낸 뒤 TIME_WAIT에 머물다 닫힙니다. 그래서 FIN, ACK, FIN, ACK 네 번으로 보이는 것입니다. 상대가 FIN을 보냈는데 내 애플리케이션이 close를 하지 않으면 내 쪽은 CLOSE_WAIT에 남아 있으므로 CLOSE_WAIT가 쌓이면 close 누락을 의심합니다.

(공식 문서) RFC 9293 §3.6은 CLOSE를 '더 보낼 데이터가 없다'는 뜻으로 단방향(simplex)으로 다루며, close한 쪽도 상대가 close했다는 신호를 받을 때까지 계속 수신할 수 있고 close한 쪽은 닫힌 연결을 끝까지 읽어야 한다고 한다. §3.6.1은 두 방향이 독립적으로 닫히므로 한 방향만 닫힌 '반닫힘' 연결이 가능하다고 한다. Figure 12의 정상 종료는 FIN-WAIT-1 → FIN-WAIT-2 → TIME-WAIT(먼저 닫은 쪽)과 CLOSE-WAIT → LAST-ACK(상대) 순서이고, Figure 13은 동시 종료(CLOSING)다. §3.3.2는 CLOSE-WAIT를 '로컬 사용자의 종료 요청을 기다리는 상태'로 정의한다. 또 FIN 대신 RST로 연결을 즉시 버리는 abort도 있다. §3.6.1은 close한 쪽이 더는 읽지 못하는 half-duplex 방식의 close를 구현해도 된다(MAY)고도 하므로, 'FIN 뒤에도 계속 받는다'는 것은 규격이 기본으로 서술하는 동작이지만 모든 구현이 그런 것은 아니다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 클라이언트가 shutdown(SHUT_WR)을 하자 서버의 recv가 빈 바이트열(FIN 수신)을 돌려줬고, 서버가 그 뒤에 보낸 데이터를 클라이언트가 정상적으로 읽었다. 이때 netstat는 클라이언트 FIN_WAIT_2, 서버 CLOSE_WAIT를 보였고, 서버가 close한 뒤에는 먼저 FIN을 보낸 클라이언트 쪽이 TIME_WAIT가 되었다.
(보충) CLOSE_WAIT가 계속 쌓이면 애플리케이션의 close 누락을 의심하라는 것은 RFC 정의(로컬 사용자의 close를 기다리는 상태)에서 이끌어 낸 운영상의 경험칙이다.
