---
slug: "aws-06"
topic: "cloud-aws"
tier: TRICKY
difficulty: 3
title: "퍼블릭 IP를 붙였는데도 인스턴스가 인터넷과 통신하지 못한다면 무엇을 확인해야 하나요?"
keywords: ["퍼블릭 IP만으로는 부족", "라우팅 테이블의 인터넷 게이트웨이 경로", "VPC에 인터넷 게이트웨이 연결", "보안 그룹 규칙", "네트워크 ACL"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html", "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html", "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html", "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html"]
concepts: [cloud-network]
importance: 1
links: [{to: "aws-04", kind: PREREQ}, {to: "aws-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
퍼블릭 IP는 필요조건일 뿐이고 경로가 없으면 통신하지 못합니다. 공식 문서도 서브넷의 라우팅 테이블에 인터넷 게이트웨이로 가는 경로가 없으면, 인스턴스에 퍼블릭 IP가 있어도 인터넷과 통신할 수 없다고 설명합니다. 그래서 먼저 인터넷 게이트웨이가 VPC에 연결돼 있는지, 인스턴스가 속한 서브넷의 라우팅 테이블에 `0.0.0.0/0`을 인터넷 게이트웨이로 보내는 경로가 있는지 봅니다. 기본이 아닌 VPC에는 이 둘이 처음부터 없고 퍼블릭 IP 자동 할당도 꺼져 있습니다. 그다음 실제로 퍼블릭 IP나 Elastic IP를 받았는지, 보안 그룹에 해당 포트의 허용 규칙이 있는지, 네트워크 ACL이 막고 있지 않은지 확인합니다.

(공식 문서) 인터넷 게이트웨이 페이지는 라우팅 테이블에 인터넷 게이트웨이 경로가 없는 프라이빗 서브넷의 인스턴스는 퍼블릭 IP가 있어도 인터넷과 통신할 수 없다고 명시한다. IPv4 통신에는 인스턴스에 퍼블릭 IPv4 주소가 필요하며, 기본 VPC는 인터넷 게이트웨이와 IPv4 기본 경로, 자동 퍼블릭 IP 할당을 갖추지만 기본이 아닌 VPC는 셋 다 없다는 표가 있다.
(공식 문서) 보안 그룹 페이지는 보안 그룹에 해당 트래픽을 허용하는 규칙이 없으면 접속할 수 없다고 예를 들고(SSH 규칙이 없으면 접속 불가), 네트워크 ACL 페이지는 서브넷 수준의 허용·거부를 설명한다. 점검 순서는 문서가 제시한 것이 아니라 위 내용을 정리한 것이다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
