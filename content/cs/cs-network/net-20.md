---
slug: "net-20"
topic: "cs-network"
tier: TRICKY
difficulty: 2
title: "L4 로드밸런서와 L7 로드밸런서는 어떻게 다르고, keep-alive 연결 하나에 요청이 몰리는 현상은 왜 생기나요?"
keywords: ["IP 주소와 포트", "TCP 연결 단위", "요청 단위", "프록시, 즉 게이트웨이", "keep-alive 연결 하나", "경로, 호스트 이름, 헤더"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc2391.html", "https://www.rfc-editor.org/rfc/rfc9112.html", "https://book.systemsapproach.org/foundation/architecture.html"]
refs: ["Computer Networks: A Systems Approach, 1.3.5 Internet Architecture (웹 판)"]
concepts: [network-layers, msa-boundary]
importance: 2
links: [{to: "dst-05", kind: RELATED}, {to: "dst-08", kind: RELATED}, {to: "web-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
L4 로드밸런서는 IP 주소와 포트 같은 전송 계층 정보만 보고 TCP 연결 단위로 서버를 고르기 때문에 빠르고 단순하지만 요청 내용은 모릅니다. L7 로드밸런서는 HTTP 같은 응용 계층 메시지를 해석해 경로, 호스트 이름, 헤더를 기준으로 요청 단위로 서버를 고르며, 클라이언트와 서버 각각과 별도 연결을 맺는 프록시, 즉 게이트웨이처럼 동작합니다. 그래서 L4에서는 클라이언트가 keep-alive 연결 하나로 여러 요청을 보내면 모두 같은 서버로 가서 부하가 한쪽에 몰릴 수 있고, L7은 요청마다 분산하거나 경로별로 다른 서버군으로 보낼 수 있습니다. 대신 L7은 메시지를 해석하는 비용이 듭니다.

(공식 문서) RFC 9110 §3.7은 HTTP 중개자를 proxy, gateway(reverse proxy), tunnel로 나눈다. gateway는 바깥쪽 연결에서는 원본 서버처럼 동작하고 받은 요청을 번역해 안쪽 서버로 전달하며 HTTP 서비스를 여러 기계에 분산하는 데 쓰인다고 하고, 메시지가 지나는 연결 체인은 서로 별개의 연결이라고 한다. tunnel은 메시지를 바꾸지 않고 두 연결 사이를 맹목적으로 중계한다. RFC 9110 §3.7은 또 전송 계층 이하에서 HTTP 트래픽을 걸러내거나 돌려보내는 중개자(예: interception proxy)가 따로 있다고 한다. RFC 9112 §9.3은 HTTP/1.1이 기본적으로 지속 연결(persistent connection)을 쓰고 한 연결로 여러 요청과 응답을 주고받을 수 있다고 한다. RFC 2391 §1(LSNAT)은 NAT 방식의 부하 분산이 세션 단위로 이루어져 한 세션이 서버에 배정되면 그 세션이 끝날 때까지 다른 서버로 옮길 수 없다고 한다.
(실험 확인) macOS 26.6.2(Apple Silicon), Python 3.14.0, 루프백(127.0.0.1)에서 직접 만든 토이 L4 중계기(연결마다 서버를 골라 바이트만 복사)와 토이 L7 프록시(HTTP 요청을 파싱해 전달)로 요청 6개를 보냈다. keep-alive 연결 하나에 6개를 실으면 L4는 서버 A가 6개를 전부 받았고, 연결 6개로 나누면 A 3개, B 3개였다. L7은 연결 하나여도 '/api'로 시작하는 요청을 B로 보내고 나머지는 번갈아 보내 A 2개, B 4개였다. 토이 구현이며 실제 로드밸런서 제품의 동작이 아니다.
(원저자 자료) Computer Networks: A Systems Approach 1.3.5는 인터넷의 응용 계층이 7계층, 전송 계층이 4계층에 해당한다고 OSI와 대응시킨다. 'L4/L7'이라는 이름이 이 번호에서 왔다는 점은 이 대응이 뒷받침하지만 이를 제품 유형에 붙이는 방식은 책이 다루지 않는다.
(보충) L4가 'IP 주소와 포트만 본다', L7이 '경로·호스트 이름·헤더로 요청을 가른다'는 구체 기능 서술과 제품 유형 분류는 RFC나 이 책이 정한 것이 아닌 업계 용어와 일반 설명이다. 위 설명은 RFC 9110의 중개자 정의, RFC 9112의 지속 연결, RFC 2391의 세션 단위 분산 서술에 맞춰 풀어 쓴 것이다.
