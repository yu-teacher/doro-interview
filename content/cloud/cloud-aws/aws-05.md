---
slug: "aws-05"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "보안 그룹과 네트워크 ACL은 어떻게 다르고, 보통 어느 것을 주로 쓰나요?"
keywords: ["보안 그룹은 인스턴스 수준", "네트워크 ACL은 서브넷 수준", "stateful과 stateless", "허용 규칙만과 허용·거부 규칙", "번호 순서대로 규칙 평가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html", "https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html", "https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html"]
concepts: [cloud-network]
importance: 2
links: [{to: "aws-03", kind: PREREQ}, {to: "k8n-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
보안 그룹은 인스턴스 같은 리소스에 붙는 방화벽이고, 네트워크 ACL은 서브넷 경계에서 적용됩니다. 보안 그룹은 상태 저장(stateful)이라 허용한 요청의 응답은 규칙과 상관없이 자동으로 허용되고, 허용 규칙만 있으며 모든 규칙을 평가해서 판단합니다. 네트워크 ACL은 상태 비저장(stateless)이라 응답 트래픽도 규칙으로 따로 허용해야 하고, 허용과 거부 규칙이 모두 있으며 번호가 낮은 규칙부터 평가해 처음 일치한 규칙을 적용합니다. 공식 문서는 보안 그룹을 네트워크 접근 제어의 기본 수단으로 삼고, 네트워크 ACL은 특정 트래픽을 막거나 서브넷 단위 방어선을 더하는 보조 수단으로 쓰라고 권고합니다.

(공식 문서) 인프라 보안 페이지의 비교표는 보안 그룹은 인스턴스 수준, 허용 규칙만, 모든 규칙을 평가, 반환 트래픽 자동 허용이고, 네트워크 ACL은 서브넷 수준, 허용과 거부 규칙, 번호 오름차순으로 일치할 때까지 평가, 반환 트래픽은 명시적 허용 필요라고 정리한다. 이 페이지는 보안 그룹을 기본 수단으로, 네트워크 ACL을 보조 통제나 서브넷 가드레일로 쓰라고 권고한다.
(공식 문서) 네트워크 ACL 페이지는 규칙 번호가 1부터 32766까지이고 10이나 100 단위로 간격을 두라고 권고한다. 서브넷은 네트워크 ACL 하나에만 연결되고 기본 ACL은 모든 트래픽을 허용한다. 보안 그룹과 네트워크 ACL 모두 DNS, DHCP, 인스턴스 메타데이터 같은 일부 트래픽은 걸러내지 않는다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
