---
slug: "net-12"
topic: "cs-network"
tier: DEEP
difficulty: 2
title: "브라우저에 도메인을 입력하면 DNS는 어떤 순서로 IP를 찾아가나요(재귀 질의와 반복 질의)?"
keywords: ["스텁 리졸버", "재귀 질의", "루트 서버", "반복 질의", "위임 응답", "TTL 동안 캐시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc1034.html", "https://www.rfc-editor.org/rfc/rfc1035.html", "https://book.systemsapproach.org/applications/infrastructure.html"]
refs: ["Computer Networks: A Systems Approach, 9.3.1 Name Service (DNS), 이름 서버와 이름 해석 부분 (웹 판)"]
concepts: [network-layers]
importance: 3
links: [{to: "net-13", kind: FOLLOWUP}, {to: "dst-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
애플리케이션은 운영체제의 스텁 리졸버에 묻고, 스텁은 설정된 재귀 서버에게 재귀 질의를 보내 답을 끝까지 찾아 달라고 요청합니다. 캐시에 없으면 재귀 서버가 반복 질의로 직접 찾아가는데, 먼저 루트 서버에 물으면 해당 최상위 도메인의 서버를 알려 주고, 그 서버가 다시 도메인의 권한 서버를 알려 주며, 마지막으로 권한 서버가 실제 레코드를 답합니다. 중간 서버는 답 대신 다음에 물어볼 NS를 알려 주는 위임 응답을 줍니다. 결과와 위임 정보는 TTL 동안 캐시되어 같은 질의는 이후 대부분 캐시에서 바로 답합니다.

(공식 문서) RFC 1034 §2.4는 DNS를 이름 공간, 네임서버(존 단위 권한), 리졸버의 세 요소로 설명하고, §5.3.1은 스텁 리졸버가 재귀 질의를 지원하는 네임서버에 해결을 맡기며 서버는 재귀 서비스를 거부할 수 있다고 한다. §5.3.3 리졸버 알고리즘은 질의 이름부터 부모 도메인, 루트까지 올라가며 캐시된 NS를 찾아 질문할 서버 목록을 만들고, 응답이 위임이면 NS와 주소(glue)를 캐시한 뒤 더 가까운 서버로 검색을 다시 시작하며 CNAME이면 별칭 대상으로 다시 시작한다고 한다. 응답이 질의와 일치하는지 ID로 확인해야 하고 TTL이 0보다 크면 캐시에 넣는다. §3.7은 응답이 답변, 다른 서버로의 위임, 오류 중 하나라고 한다. RFC 1034 §4.3.2(3b)는 영역 경계(NS가 있는 지점)를 만나면 NS를 authority 절에, 주소를 additional 절에 담아 위임 응답을 준다고 한다. RFC 1035 §4.1.1은 RD 비트가 재귀 요청, RA 비트가 재귀 가능 표시이고 재귀 지원은 선택이라고 하며, §4.2는 질의에 UDP를 권장하되 TCP도 쓴다고 한다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 RFC 1035 형식으로 직접 만든 토이 UDP 서버 3개(루트, com, example.com)와 반복 질의 토이 리졸버를 돌렸다. 첫 조회는 세 서버에 1번씩 질의했고, 곧바로 다시 조회하면 서버 질의가 0번(캐시)이었다. A 레코드 TTL 2초가 지난 뒤에는 example.com 서버에만 1번 질의했는데, 위임 NS의 TTL이 172,800초로 캐시에 남아 있어서다. 독립된 파서로 dig(+norecurse)를 써서(재실행에서도 같았다) 응답을 확인하니 루트 서버 응답은 AUTHORITY의 NS와 ADDITIONAL의 주소를 담은 위임이고(aa 플래그 없음), 권한 서버 응답은 aa 플래그가 켜져 있었다. 실제 인터넷 DNS에는 접속하지 않았고, 토이 구현은 절차를 단순화한 것이라 실제 리졸버의 동작(재시도·보안 검증 등)을 대변하지 않는다.
(원저자 자료) Computer Networks: A Systems Approach의 DNS 절(9.3.1)은 루트 이름 서버가 각 최상위 도메인 서버를 가리키는 NS 레코드와 그 서버의 주소 레코드를 가지고 있어 질의자를 해당 도메인 서버로 넘기는 포인터 역할을 하고, 클라이언트가 그 서버에 같은 질의를 이어 보내 아래 단계로 내려가며 답을 찾는다고 예(penguins.cs.princeton.edu)로 설명한다. 루트에서 최상위 도메인, 그 아래 권한 서버로 내려가는 흐름을 이 책이 실제 도메인 계층 예로 뒷받침한다.
