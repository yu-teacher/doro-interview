---
slug: "net-11"
topic: "cs-network"
tier: DEEP
difficulty: 3
title: "TCP 혼잡 제어의 slow start, congestion avoidance, 빠른 재전송·회복은 어떻게 동작하나요?"
keywords: ["slow start", "ssthresh", "congestion avoidance", "중복 ACK 세 개", "한 세그먼트로 줄여", "AIMD"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc5681.html", "https://www.rfc-editor.org/rfc/rfc6928.html", "https://www.rfc-editor.org/rfc/rfc9293.html"]
concepts: [tcp]
importance: 1
---
**모범 답변 (30~60초)**
연결 초기에는 cwnd를 작게 시작해 ACK가 올 때마다 늘리는 slow start로 RTT마다 대략 두 배씩 키우다가 ssthresh에 닿으면 congestion avoidance로 넘어가 RTT당 약 한 세그먼트씩 선형으로 늘립니다. 손실은 혼잡 신호로 보고, 중복 ACK 세 개로 감지하면 ssthresh를 비행 중 데이터의 절반으로 줄이고 cwnd를 그 근처로 낮춰 계속 보내는 빠른 재전송·회복을 하며, 재전송 타이머가 만료되면 cwnd를 한 세그먼트로 줄여 slow start부터 다시 합니다. 늘릴 때는 더하고 줄일 때는 곱으로 줄이는 이 방식을 AIMD라고 합니다. 초기 윈도우 크기는 표준과 구현에 따라 다릅니다.

(공식 문서) RFC 5681 §1은 이 알고리즘들을 additive-increase, multiplicative-decrease 계열로 소개한다. §3.1은 cwnd < ssthresh면 slow start, cwnd > ssthresh면 congestion avoidance를 쓴다고 하고, slow start에서는 새 데이터를 확인하는 ACK마다 cwnd를 최대 SMSS만큼 늘리며, congestion avoidance에서는 RTT당 최대 1 SMSS씩 늘린다고 한다. ssthresh 초기값은 임의로 크게 잡고, 손실 시 ssthresh를 max(FlightSize/2, 2×SMSS) 이하로 설정하며(MUST), 타이머 만료 시 cwnd를 1개의 full-sized 세그먼트(loss window)로 줄인다. 이 문서의 초기 윈도우 상한은 SMSS에 따라 2~4개 세그먼트다. §3.2는 중복 ACK 3개에서 빠른 재전송을 하고 ssthresh를 같은 식으로 줄인 뒤 cwnd = ssthresh+3×SMSS로 두며, 새 데이터를 확인하는 ACK가 오면 cwnd를 ssthresh로 되돌린다고 한다. RFC 6928(실험적 문서)은 초기 윈도우를 min(10×MSS, max(2×MSS, 14600))으로 늘리는 실험을 제안한다. RFC 9293 §3.8.2는 slow start, congestion avoidance, RTO 지수 백오프의 구현을 필수(MUST)로 하되 표준과 호환되는 대체 알고리즘도 허용(MAY)한다.
(실험 확인) RFC 5681 식을 코드로 옮겨 계산했다(실제 TCP 스택을 관찰한 것이 아니라 식의 산술 확인이며, 손실 없음, IW=10, ssthresh=64세그먼트). cwnd는 RTT마다 10→20→40→80으로 두 배가 된 뒤 ssthresh를 넘으면 RTT당 1씩 늘었고, 비행 중 40세그먼트에서 중복 ACK 3개가 오면 ssthresh=20, 타임아웃이면 ssthresh=20에 cwnd=1이었다. 또 macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 macOS의 TCP_CONNECTION_INFO로 연결 상태를 읽으니 새 연결의 cwnd가 163,320바이트(= maxseg 16,332의 10배), ssthresh가 약 1 GiB로 사실상 무한이었고, 데이터를 보내자 cwnd가 26.1→42.1→56.1→72.2→88.2 MSS(재실행 값)로 커졌다(손실 없는 루프백이라 ssthresh에 닿기 전). 구조체 필드 해석은 macOS 헤더에 의존하며 초기 cwnd가 10배로 읽힌 것이 해석이 맞다는 정황 증거다. macOS 기본 초기 윈도우가 10세그먼트인 것은 RFC 6928 방향과 일치하지만, RFC 5681의 상한(4)과는 다르다.
(보충) 'slow start에서 RTT마다 약 두 배'는 ACK마다 최대 1 SMSS씩 늘린다는 규칙에서 이끌어 낸 값으로 RFC 5681 본문에 그런 표현은 없고, 지연 ACK가 있으면 증가가 더 느리다. RTT당 약 한 세그먼트의 선형 증가는 §3.1에 있다. 실제 OS가 기본으로 쓰는 혼잡 제어 알고리즘의 이름과 세부 차이는 참고한 문서에 없어 다루지 않았다.
