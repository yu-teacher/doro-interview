---
slug: "aws-03"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "VPC에서 퍼블릭 서브넷과 프라이빗 서브넷은 무엇으로 구분하고, 웹·애플리케이션·DB는 보통 어떻게 배치하나요?"
keywords: ["논리적으로 격리된 가상 네트워크", "인터넷 게이트웨이 경로 유무", "서브넷은 하나의 AZ", "프라이빗 서브넷에 DB", "서브넷마다 라우팅 테이블"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html", "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html", "https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html", "https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html"]
concepts: [cloud-network]
importance: 3
links: [{to: "aws-04", kind: FOLLOWUP}, {to: "aws-05", kind: FOLLOWUP}, {to: "net-06", kind: RELATED}, {to: "net-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
VPC는 AWS 안에 정의하는 논리적으로 격리된 가상 네트워크이고, 서브넷은 그 안의 IP 주소 범위로 가용 영역 하나에 속합니다. 퍼블릭이냐 프라이빗이냐는 이름이 아니라 라우팅으로 정해집니다. 서브넷에 연결된 라우팅 테이블에 인터넷 게이트웨이로 가는 경로가 있으면 퍼블릭, 없으면 프라이빗입니다. 모든 서브넷은 라우팅 테이블에 연결되며, 직접 연결하지 않으면 VPC의 기본 라우팅 테이블이 자동으로 연결됩니다. 공식 문서는 인터넷에서 직접 접근하면 안 되는 인스턴스는 프라이빗 서브넷에 두라고 권고하고, 서브넷으로 웹·애플리케이션·데이터베이스 같은 계층을 나누라고 합니다. 프라이빗 서브넷의 외부 통신에는 NAT 장치나 배스천 호스트를 씁니다.

(공식 문서) VPC 사용 설명서는 VPC를 논리적으로 격리된 가상 네트워크로, 서브넷을 하나의 가용 영역에 속하는 IP 주소 범위로 정의한다. 서브넷 페이지는 서브넷 유형이 라우팅 구성으로 정해진다고 하며, 인터넷 게이트웨이로 가는 직접 경로가 있으면 퍼블릭 서브넷, 없으면 프라이빗 서브넷이라고 한다. 모든 서브넷은 라우팅 테이블에 연결되고 만들면 자동으로 주 라우팅 테이블에 연결된다.
(공식 문서) 서브넷 보안 절은 프라이빗 서브넷 사용을 권고하고 인터넷 접근에는 배스천 호스트나 NAT 장치를 쓰라고 한다. 인프라 보안 페이지는 서브넷으로 애플리케이션 계층(웹, 애플리케이션, 데이터베이스)을 격리하라고 한다.
(보충) 로드 밸런서를 퍼블릭에 두고 애플리케이션과 DB를 프라이빗에 두는 배치는 흔한 구성 관행으로, 위 문서가 이 배치를 직접 명시하지는 않는다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
