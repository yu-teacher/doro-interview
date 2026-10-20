---
slug: "net-09"
topic: "cs-network"
tier: DEEP
difficulty: 2
title: "TCP 연결을 먼저 닫은 쪽이 TIME_WAIT 상태에 머무는 이유는 무엇이고, 서버에 TIME_WAIT가 많이 쌓이면 어떻게 하나요?"
keywords: ["마지막 ACK가 유실", "지연된 세그먼트", "2×MSL", "MSL을 2분", "어느 쪽이 먼저 닫을지", "타임스탬프"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9293.html", "https://www.rfc-editor.org/rfc/rfc8085.html"]
---
**모범 답변 (30~60초)**
먼저 닫은 쪽이 마지막 ACK를 보낸 뒤 연결 정보를 바로 지우면 두 가지 문제가 생깁니다. 마지막 ACK가 유실되면 상대가 FIN을 다시 보내는데 응답할 쪽이 없고, 같은 주소·포트 조합으로 곧바로 새 연결을 맺으면 이전 연결의 지연된 세그먼트가 새 연결에 섞일 수 있습니다. 그래서 규격은 2×MSL 동안 TIME-WAIT에 머물도록 하고 MSL을 2분으로 가정합니다. 서버에 많이 쌓이면 어느 쪽이 먼저 닫을지를 설계로 조정하거나 연결을 재사용해 연결 수 자체를 줄이고, 포트 고갈이 문제라면 타임스탬프를 이용한 재사용 같은 규격의 완화책을 확인합니다. 타이머를 무작정 줄이는 것은 위 안전장치를 포기하는 일입니다.

(공식 문서) RFC 9293 §3.3.2는 TIME-WAIT를 '상대가 종료 요청의 ACK를 받았음을 확신하고 이전 연결의 지연된 세그먼트가 새 연결에 영향을 주지 않도록 충분히 기다리는 상태'로 정의한다. §3.4.1은 TIME-WAIT가 연결 재사용 속도를 제한한다고 하고, §3.6.1은 능동적으로 닫은 연결이 2×MSL 동안 TIME-WAIT에 머물러야 한다(MUST)고 하며, 이 상태에서 새 SYN으로 연결을 다시 여는 것은 새 ISN이 이전 연결의 최대 순번보다 크다는 등의 조건에서만 허용(MAY)한다. 타임스탬프 옵션을 이용한 TIME-WAIT 축소 알고리즘은 구현 권고(SHOULD)라고 한다. §3.4.2는 이 규격에서 MSL을 2분으로 잡았고 이는 공학적 선택이라 바뀔 수 있다고 한다. RFC 8085 §3은 닫는 쪽을 애플리케이션이 제어해 TIME-WAIT 유지 부담을 옮길 수 있다고 한다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 서버가 먼저 close하자 서버 쪽 연결이 TIME_WAIT로 남았다(netstat). 리스너를 닫은 뒤 그 포트에 SO_REUSEADDR 없이 bind하면 Address already in use였고, SO_REUSEADDR를 켜면 성공했다. TIME_WAIT는 약 30~31초 뒤 사라졌는데(재실행에서 30초), 이 Mac의 net.inet.tcp.msl이 15,000 ms라 2×MSL이 30초이기 때문이다. RFC가 가정한 MSL 2분과 다르므로 TIME_WAIT 지속 시간은 구현 의존적이며, Linux 값은 근거 문서를 읽지 않아 적지 않는다.
(보충) '연결을 재사용해 연결 수 자체를 줄인다'는 대응은 RFC에 없는 일반적인 운영 요령이다. RFC 8085 §3이 말하는 것은 어느 쪽이 닫을지 제어해 TIME-WAIT 부담을 옮길 수 있다는 점까지다.
