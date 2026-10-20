---
slug: "net-16"
topic: "cs-network"
tier: TRICKY
difficulty: 3
title: "MTU, MSS, IP 단편화, 경로 MTU 탐색(PMTUD)은 어떤 관계이고, 큰 패킷만 일부 구간에서 막히는 이유는 무엇인가요?"
keywords: ["MTU에서 IP·TCP 헤더 40바이트를 뺀 값", "DF 비트", "단편화가 필요하다는 ICMP", "경로 MTU 탐색(PMTUD)", "출발지만", "이 ICMP를 막으면"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc791.html", "https://www.rfc-editor.org/rfc/rfc792.html", "https://www.rfc-editor.org/rfc/rfc1191.html", "https://www.rfc-editor.org/rfc/rfc9293.html", "https://www.rfc-editor.org/rfc/rfc8200.html", "https://www.rfc-editor.org/rfc/rfc8085.html"]
---
**모범 답변 (30~60초)**
MTU는 링크가 한 번에 보낼 수 있는 IP 패킷의 최대 크기이고, MSS는 TCP가 한 세그먼트에 담는 데이터의 최대량으로 대략 MTU에서 IP·TCP 헤더 40바이트를 뺀 값입니다. 패킷이 경로상 어느 링크의 MTU보다 크면 IPv4는 라우터가 단편화할 수 있지만 DF 비트가 켜져 있으면 라우터가 버리고 단편화가 필요하다는 ICMP를 돌려줍니다. 경로 MTU 탐색(PMTUD)은 DF를 켜 보내며 이 ICMP로 경로의 MTU를 알아내는 방식이고, IPv6는 라우터가 단편화하지 않고 출발지만 합니다. 그런데 방화벽이 이 ICMP를 막으면 작은 패킷은 통과하는데 큰 패킷만 조용히 사라지는 문제가 생깁니다.

(공식 문서) RFC 791은 DF 플래그가 켜지면 단편화가 허용되지 않고 폐기될 수 있다고 하고, Fragment Offset이 8옥텟 단위이며, 모든 호스트는 576옥텟까지 받을 수 있어야 하고 모든 인터넷 모듈은 68옥텟을 단편화 없이 전달할 수 있어야 한다고 한다. RFC 792 Destination Unreachable의 code 4가 '단편화가 필요하지만 DF가 설정됨'이다. RFC 1191 §2는 출발지가 DF를 켜 보내고 라우터가 이 ICMP를 돌려주면 추정 PMTU를 줄이는 방식이라 하며, §3은 증가 탐지를 Datagram Too Big 수신 후 5분, 성공한 증가 시도 후 1분 이내에는 하지 말라고(MUST NOT) 하고 PMTU 추정을 68옥텟 아래로 줄이지 않는다고(MUST) 한다. RFC 9293 §3.7.1은 MSS 옵션이 없으면 IPv4 536(576−40), IPv6 1220(1280−60)을 기본으로 가정하라(MUST)고 하고 유효 MSS를 연결 가능한 최대 전송 크기에서 헤더 크기를 뺀 값으로 정하며, §3.7.2는 PMTUD가 ICMP에 의존하고 PLPMTUD는 ICMP 지원이 없어도 동작하지만 단편화를 피하려는 목적은 같다고 한다. RFC 8200 §4.5는 IPv6 단편화가 출발지에서만 이루어진다고 하고 §5는 모든 링크의 MTU가 1280 이상이어야 한다고 한다. RFC 8085 §3.2는 단편화가 효율과 신뢰성을 떨어뜨려 한 조각이 사라지면 전체가 사라지고 일부 NAT·방화벽은 조각을 버리며, PMTUD용 ICMP가 점점 필터링되고 있어 ICMP에 의존하지 않는 PLPMTUD가 더 견고하다고 한다.
(실험 확인) RFC 791 공식을 코드로 계산했다(산술 확인). 페이로드 4000바이트를 MTU 1500(헤더 20)으로 나누면 조각 3개(데이터 1480, 1480, 1040바이트, 오프셋 0, 185, 370, MF=1,1,0)이고 패킷 크기는 1500, 1500, 1060이다. MSS는 MTU 1500에서 1460, MTU 1280에서 1240(옵션 없는 IPv4 기준)이다. macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 루프백 MTU는 16384(ifconfig lo0)이고 TCP 연결에서 읽은 maxseg는 16332로, 16384−40보다 12 작았다(TCP 옵션 몫으로 추정되며 확인하지 않았다). PMTUD 블랙홀은 루프백에서 재현할 수 없어 RFC 8085의 ICMP 필터링 서술에 근거한 설명이다.
(보충) '작은 패킷은 통과하고 큰 패킷만 사라진다'는 증상 서술은 RFC 8085가 말하는 PMTUD용 ICMP 필터링과 black holing에서 이끌어 낸 설명이다. PMTUD는 IPv4(RFC 1191) 기준으로 읽었고 IPv6용 PMTUD(RFC 8201)는 읽지 않았다.
