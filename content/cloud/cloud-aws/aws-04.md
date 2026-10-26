---
slug: "aws-04"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "인터넷 게이트웨이와 NAT 게이트웨이는 각각 무슨 역할이고, 프라이빗 서브넷의 서버가 외부 API를 호출하려면 어떻게 구성하나요?"
keywords: ["인터넷 게이트웨이는 양방향 통로", "퍼블릭 IP 필요", "NAT 게이트웨이는 아웃바운드 전용", "퍼블릭 서브넷에 NAT 배치", "Elastic IP 연결", "프라이빗 라우팅 테이블에 NAT 경로"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html", "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html", "https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html", "https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-scenarios.html", "https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html", "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html", "https://docs.aws.amazon.com/vpc/latest/privatelink/vpce-gateway.html"]
concepts: [cloud-network]
importance: 2
links: [{to: "aws-03", kind: PREREQ}, {to: "aws-06", kind: FOLLOWUP}, {to: "net-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
인터넷 게이트웨이는 VPC와 인터넷 사이의 통로로, 퍼블릭 IP가 있는 리소스는 밖으로 나가는 통신도 밖에서 먼저 들어오는 통신도 가능합니다. 프라이빗 서브넷의 서버에는 이 경로가 없으므로, 퍼블릭 서브넷에 (영역 단위) 퍼블릭 NAT 게이트웨이를 만들어 Elastic IP를 연결하고, 프라이빗 서브넷의 라우팅 테이블에서 외부로 가는 경로 `0.0.0.0/0`의 대상을 그 NAT 게이트웨이로 지정합니다. NAT 게이트웨이의 트래픽은 다시 인터넷 게이트웨이로 나갑니다. 이렇게 하면 프라이빗 인스턴스가 밖으로 연결을 여는 것은 되지만 외부가 먼저 연결을 시작할 수는 없고, 응답은 NAT가 원래 인스턴스 주소로 되돌려 줍니다.

(공식 문서) 인터넷 게이트웨이 페이지는 이것이 수평 확장되고 중복화된 고가용성 VPC 구성 요소이며, 퍼블릭 IPv4나 IPv6 주소가 있는 퍼블릭 서브넷 리소스가 인터넷과 양방향으로 연결되게 한다고 한다. 라우팅 테이블에 이 게이트웨이로 가는 경로가 없는 서브넷은 프라이빗이다.
(공식 문서) NAT 게이트웨이 페이지는 프라이빗 서브넷 인스턴스가 VPC 밖 서비스에 연결하되 외부가 먼저 연결을 시작하지 못하게 하는 서비스라고 한다. 퍼블릭 NAT 게이트웨이는 퍼블릭 서브넷에 만들고 생성 시 Elastic IP를 연결해야 하며, 트래픽을 VPC의 인터넷 게이트웨이로 보낸다. VPC 요금 설명은 NAT 게이트웨이 같은 일부 구성 요소에는 요금이 붙는다고 한다.
(공식 문서) 게이트웨이 엔드포인트 페이지는 S3와 DynamoDB는 게이트웨이 엔드포인트로 인터넷 게이트웨이나 NAT 없이 접근할 수 있고 추가 요금이 없다고 한다. NAT 게이트웨이 사용 사례 페이지는 프라이빗 서브넷 라우팅 테이블의 `0.0.0.0/0` 대상을 퍼블릭 서브넷의 NAT 게이트웨이로 두는 예를 보이고, 기본 방식의 NAT 게이트웨이는 특정 가용 영역에 만들어져 그 영역이 죽으면 다른 영역 자원이 인터넷 접근을 잃으므로 영역마다 두라고 한다(기본 개요 페이지). 리전 단위 NAT 게이트웨이 페이지는 이 방식이 별도 퍼블릭 서브넷 없이 여러 가용 영역으로 자동 확장된다고 하므로, 위 답변은 영역 단위(기본) 방식 기준이다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
