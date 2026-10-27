---
slug: "aws-02"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "AWS 리전(Region)과 가용 영역(Availability Zone)은 무엇이고, 왜 여러 가용 영역에 나눠 배치하나요?"
keywords: ["리전은 지리적 영역", "가용 영역은 격리된 위치", "리전 간 자원 자동 복제 없음", "단일 AZ 장애 대비", "서브넷은 하나의 AZ"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html", "https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html"]
concepts: [high-availability]
importance: 3
links: [{to: "aws-13", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
리전은 서로 떨어진 지리적 영역이고, 각 리전 안에는 물리적으로 분리된 독립 가용 영역이 여러 개 있습니다. 리전끼리도 서로 격리되어 있어서, 한 리전에 만든 자원과 데이터는 복제 기능을 쓰지 않는 한 다른 리전에 존재하지 않습니다. 그래서 리전은 고객과 가깝거나 법적 요건에 맞는 곳으로 고르고, 가용 영역은 장애 대비용으로 나눠 씁니다. 인스턴스를 한 위치에만 두면 그곳에 장애가 났을 때 전부 쓸 수 없으므로, 여러 가용 영역에 서브넷을 만들고 인스턴스를 나눠 배치합니다. 서브넷 하나는 가용 영역 하나 안에만 존재하고 여러 영역에 걸칠 수 없습니다.

(공식 문서) 장애 격리 경계 백서는 리전이 지리적 영역 안의 독립되고 물리적으로 분리된 가용 영역 여러 개로 구성되며, 모든 리전에 현재 가용 영역이 세 개 이상이라고 한다(이 문서의 그림은 2022년 12월 기준이라 현재 수치는 문서를 확인해야 한다). 한 리전의 자원과 데이터는 복제·복사 기능을 쓰지 않으면 다른 리전에 존재하지 않는다고도 한다.
(공식 문서) EC2 사용 설명서는 리전을 고객과의 거리나 법적 요건에 맞춰 고르라고 하고, 여러 가용 영역에 인스턴스를 띄우면 한 위치의 장애로부터 보호할 수 있다고 한다. VPC 사용 설명서는 서브넷이 하나의 가용 영역 안에 완전히 속하고 여러 영역에 걸칠 수 없다고 한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
