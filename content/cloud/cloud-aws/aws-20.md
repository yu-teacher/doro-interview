---
slug: "aws-20"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "EC2 Auto Scaling 그룹은 어떻게 동작하고, 로드 밸런서와 함께 쓸 때 헬스 체크에서 주의할 점은 무엇인가요?"
keywords: ["최소·희망·최대 용량", "비정상 인스턴스 교체", "ELB 헬스 체크는 직접 켜야 함", "목표 추적 조정", "여러 가용 영역에 분산", "시작 템플릿"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/autoscaling/ec2/userguide/what-is-amazon-ec2-auto-scaling.html", "https://docs.aws.amazon.com/autoscaling/ec2/userguide/auto-scaling-groups.html", "https://docs.aws.amazon.com/autoscaling/ec2/userguide/health-checks-overview.html", "https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-add-elb-healthcheck.html", "https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html"]
concepts: [autoscaling, load-balancer]
importance: 2
links: [{to: "aws-18", kind: PREREQ}, {to: "k8s-14", kind: RELATED}, {to: "k8w-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
Auto Scaling 그룹은 EC2 인스턴스 묶음으로, 최소 크기 아래로 줄이지 않고 최대 크기 위로 늘리지 않으며 희망 용량만큼의 인스턴스를 유지합니다. 인스턴스 구성은 시작 템플릿으로 정하고 여러 가용 영역에 균등하게 분산합니다. 인스턴스가 비정상이면 종료하고 새로 띄워 용량을 유지합니다. 주의할 점은 기본 헬스 체크가 EC2 상태 점검이라는 것입니다. 로드 밸런서가 비정상으로 보는 인스턴스까지 교체하려면 그룹에서 ELB 헬스 체크를 직접 켜야 합니다. 조정 정책으로는 CPU 평균이나 대상당 요청 수 같은 지표의 목표값을 유지하는 목표 추적 방식을 AWS가 권장하고, 단계 조정, 단순 조정, 예약 조정도 있습니다.

(공식 문서) Auto Scaling 소개 페이지는 최소·최대·희망 용량 동작, 시작 템플릿 사용, 여러 가용 영역으로의 균등 분산, 비정상 인스턴스 교체를 설명한다. 
(공식 문서) 헬스 체크 개요 페이지는 EC2 상태 점검과 예약 이벤트가 기본 헬스 체크 유형이고, ELB 헬스 체크는 그룹에서 켜야 실행된다고 한다. 로드 밸런서 연결 페이지도 기본적으로 EC2 헬스 체크로만 교체하며 ELB 헬스 체크를 켜면 로드 밸런서가 비정상으로 보고하는 실행 중 인스턴스도 교체할 수 있다고 한다. 상태 점검이 일시적으로 실패하면 곧바로 비정상으로 표시하지는 않고 몇 분 기다린다는 설명도 있다.
(공식 문서) 동적 조정 페이지는 목표 추적, 단계, 단순 조정 정책을 소개하며 목표 추적을 강하게 권장한다. 정책이 요청한 증감도 그룹의 최소·최대를 넘지 않도록 제한된다고 한다(인스턴스 가중치를 쓰면 예외가 있다). 예약 조정은 Auto Scaling 그룹 페이지가 일정에 따른 조정도 가능하다고 한 서술에 근거한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
