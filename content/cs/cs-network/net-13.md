---
slug: "net-13"
topic: "cs-network"
tier: DEEP
difficulty: 2
title: "DNS 레코드(A, AAAA, CNAME, NS, MX, TXT, SOA)는 각각 무엇이고, TTL과 캐시는 어떻게 동작하나요?"
keywords: ["IPv4 주소", "별칭", "권한 네임서버", "TTL", "NXDOMAIN", "SOA 최소값"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc1034.html", "https://www.rfc-editor.org/rfc/rfc1035.html", "https://www.rfc-editor.org/rfc/rfc3596.html", "https://www.rfc-editor.org/rfc/rfc2181.html", "https://www.rfc-editor.org/rfc/rfc2308.html"]
concepts: [network-layers]
importance: 2
---
**모범 답변 (30~60초)**
A는 도메인의 IPv4 주소, AAAA는 IPv6 주소, CNAME은 다른 이름의 별칭, NS는 그 도메인을 맡은 권한 네임서버, MX는 메일 서버와 우선순위, TXT는 문자열 데이터, SOA는 존의 시작과 관리 정보를 담습니다. 모든 레코드에는 TTL이 있어 리졸버는 그 초만큼만 캐시한 뒤 다시 물어봅니다. 그래서 레코드를 바꿔도 이전 값이 TTL이 지날 때까지 캐시에 남을 수 있습니다. 없는 이름이라는 응답(NXDOMAIN)도 캐시되며 그 시간은 SOA 최소값과 SOA 자신의 TTL 중 작은 값입니다. 또 한 이름에 CNAME이 있으면 같은 이름에 다른 종류의 레코드를 함께 둘 수 없습니다(DNSSEC 서명 레코드는 예외).

(공식 문서) RFC 1034 §3.6은 A(호스트 주소), CNAME(별칭의 정식 이름), NS(권한 네임서버), MX(16비트 선호값, 낮을수록 우선 + 호스트), SOA(존의 권한 시작)와 TTL(캐시 가능 시간, 초 단위 32비트)을 정의하고, 변경이 예상되면 변경 전에 TTL을 줄였다가 이후 되돌릴 수 있다고 한다. RFC 1035는 TTL 0이면 진행 중인 트랜잭션에만 쓰고 캐시하지 않는다고 하며 TXT 형식(§3.3.14)과 SOA의 MINIMUM 필드(§3.3.13)도 정의한다. RFC 3596 §2는 AAAA를 128비트 IPv6 주소를 담는 레코드 타입(값 28)으로 정의한다. RFC 2181 §8은 TTL이 부호 없는 31비트 값(최대 2,147,483,647)이며 최대 수명이지 의무 수명이 아니고 구현이 상한을 둘 수 있다고 하고, §5.2는 같은 RRSet의 TTL은 같아야 한다고 하며, §10.1은 한 이름에는 CNAME 하나만 있거나 CNAME 외의 레코드들만 있어야 한다고 하며 DNSSEC 레코드(SIG, NXT, KEY)는 CNAME과 함께 있을 수 있다는 예외를 둔다. RFC 2308 §3·§5는 음성 응답에 SOA를 실어 TTL로 삼고 그 값을 SOA TTL과 MINIMUM 중 작은 값으로 정한다고 하며(§4는 MINIMUM의 의미를 음성 응답 TTL로 정리하고 RFC 1035의 '영역 내 최소 TTL' 의미를 폐기한다), 캐시 상한은 1~3시간 정도가 적당하고 하루를 넘으면 문제가 된다고 한다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)의 토이 DNS 서버(dig로 응답 확인)에서 A 레코드는 TTL 2초로 내려갔고, 없는 이름에는 NXDOMAIN과 함께 AUTHORITY에 SOA(minimum 4)가 실려 왔다. 토이 리졸버는 NXDOMAIN을 4초 동안 캐시해 두 번째 조회는 서버 질의가 0번이었고 4.2초 뒤에는 다시 1번 질의했다.
