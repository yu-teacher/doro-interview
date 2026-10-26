---
slug: "aws-18"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "ALB와 NLB는 어떻게 다르고 어떤 경우에 각각 쓰나요?"
keywords: ["ALB는 7계층", "NLB는 4계층", "경로·호스트 기반 라우팅", "TCP·UDP·TLS", "정적 IP 지원", "리스너와 대상 그룹"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html", "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html", "https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html"]
concepts: [load-balancer]
importance: 2
links: [{to: "aws-19", kind: FOLLOWUP}, {to: "net-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
ALB는 OSI 7계층 로드 밸런서로, 리스너 규칙의 조건에 따라 요청 내용을 보고 대상 그룹으로 나눕니다. 경로, 호스트 헤더, HTTP 헤더와 메서드, 쿼리 파라미터, 소스 IP 조건으로 라우팅할 수 있어서 URL 경로별로 서비스를 나누는 HTTP 애플리케이션에 맞고, Lambda 함수도 대상으로 둘 수 있습니다. NLB는 4계층 로드 밸런서로 TCP, UDP, TLS 같은 연결을 대상에 전달하며 초당 수백만 요청을 처리할 수 있고, 가용 영역마다 정적 IP를 가지며 Elastic IP를 붙일 수 있습니다. 그래서 HTTP 라우팅이 필요하면 ALB를, HTTP가 아닌 프로토콜이나 고정 IP, 큰 처리량이 필요하면 NLB를 선택합니다.

(공식 문서) ALB 소개 페이지는 ALB가 OSI 7계층에서 동작하며 리스너 규칙을 우선순위 순으로 평가해 콘텐츠 기반으로 대상 그룹에 라우팅하고, 경로·호스트·HTTP 헤더·메서드·쿼리 파라미터·소스 IP 조건과 Lambda 대상을 지원한다고 한다. 기본 라우팅 알고리즘은 라운드 로빈이다.
(공식 문서) NLB 소개 페이지는 NLB가 4계층에서 동작하고 초당 수백만 요청을 처리할 수 있으며 TCP·UDP·`TCP_UDP`·TLS·QUIC 대상 그룹을 지원한다고 한다. 활성화한 가용 영역마다 네트워크 인터페이스와 정적 IP를 얻고 인터넷 연결 NLB에는 서브넷당 Elastic IP를 하나 연결할 수 있다. 로드 밸런서 종류에는 Gateway Load Balancer와 이전 세대 Classic Load Balancer도 있다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
