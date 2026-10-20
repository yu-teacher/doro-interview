---
slug: "net-19"
topic: "cs-network"
tier: TRICKY
difficulty: 2
title: "대역폭이 큰데도 한 TCP 연결이 느린 이유는 무엇이고, 지연·대역폭·RTT·BDP는 어떤 관계인가요?"
keywords: ["대역폭", "RTT", "윈도우를 RTT로 나눈 값", "BDP", "윈도우 스케일 옵션", "slow start"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc7323.html", "https://www.rfc-editor.org/rfc/rfc5681.html", "https://www.rfc-editor.org/rfc/rfc6298.html", "https://www.rfc-editor.org/rfc/rfc9293.html"]
concepts: [tcp]
importance: 1
---
**모범 답변 (30~60초)**
대역폭은 단위 시간에 보낼 수 있는 양이고 지연은 한 비트가 가는 데 걸리는 시간이며 RTT는 갔다 오는 왕복 시간입니다. TCP는 ACK를 받기 전까지 윈도우만큼만 보낼 수 있으므로 한 연결의 처리량은 윈도우를 RTT로 나눈 값을 넘지 못합니다. 대역폭에 RTT를 곱한 BDP가 회선을 가득 채우는 데 필요한 미확인 데이터량이라, 윈도우가 BDP보다 작으면 회선이 남아도 속도가 안 납니다. 예를 들어 100 Mbit/s, RTT 50 ms의 BDP는 약 625,000바이트이고 16비트 윈도우 한도인 64 KiB만 쓰면 약 10.5 Mbit/s에 그칩니다. 그래서 윈도우 스케일 옵션이 필요하고, 연결 초기에는 slow start 때문에 짧은 전송이 대역폭을 다 쓰지 못합니다.

(공식 문서) RFC 7323 §1.1은 16비트 수신 윈도우 필드 때문에 윈도우가 최대 64 KiB이며 대역폭×지연(BDP)이 이를 넘는 긴 뚱뚱한 경로(LFN)에서는 수신 윈도우가 최대 처리량을 제한한다고 하고, 그 한도는 '파이프를 채우기 위해 TCP가 보낼 수 있는 미확인 데이터량'이라는 설명과 같은 맥락이다. §2는 Window Scale 옵션이 SYN에서만 보내져 협상되고 최대 지수가 14라서 윈도우가 1 GiB까지 가능하다고 한다. RFC 5681 §3.1은 연결 초기의 cwnd(초기 윈도우)가 작게 시작해 slow start로 커진다고 하고, RFC 6298은 RTT 측정으로 RTO를 정한다.
(실험 확인) 식을 코드로 계산했다. 100 Mbit/s×50 ms=625,000바이트(610.4 KiB), 윈도우 65,535바이트÷50 ms=10.49 Mbit/s, 1 Gbit/s×100 ms=11.9 MiB, 윈도우 스케일 최대 2^30=1,073,741,824바이트였다. macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 1바이트 에코 왕복의 중앙값은 약 15~16 μs, p99는 약 56~63 μs(두 번 실행)여서 같은 호스트 안의 RTT는 매우 작았고, 이 연결에서 TCP_CONNECTION_INFO로 읽은 윈도우 스케일 계수는 6으로 협상되어 있었다.
(보충) 지연을 전파·전송·큐잉 지연으로 나누는 설명과 '지연 vs 대역폭' 비유는 참고한 RFC에 없는 일반 개념이다. 식 '처리량 ≤ 윈도우/RTT'는 RFC의 윈도우 서술에서 이끌어 낸 단순 계산이다.
