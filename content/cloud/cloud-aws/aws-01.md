---
slug: "aws-01"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "IaaS, PaaS, SaaS는 어떻게 다르고, AWS의 공동 책임 모델에서 EC2와 S3는 책임 범위가 어떻게 다른가요?"
keywords: ["IaaS는 인프라를 빌려 씀", "PaaS는 기반 관리를 위임", "SaaS는 완성된 소프트웨어", "클라우드의 보안과 클라우드 안의 보안", "EC2 게스트 OS는 고객 책임"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://aws.amazon.com/types-of-cloud-computing/", "https://aws.amazon.com/compliance/shared-responsibility-model/"]
concepts: [cloud-fundamentals]
importance: 2
---
**모범 답변 (30~60초)**
IaaS는 네트워크, 가상 서버, 스토리지 같은 기본 구성 요소를 빌려 쓰는 모델이라 가장 유연한 대신 관리 책임이 큽니다. PaaS는 하드웨어와 운영체제 같은 기반 관리를 제공자가 맡아 주어 애플리케이션 배포와 관리에 집중하는 모델이고, SaaS는 제공자가 운영하는 완성된 소프트웨어를 쓰기만 하는 모델입니다. AWS 공동 책임 모델은 이 차이와 이어집니다. AWS는 하드웨어, 네트워크, 시설 같은 클라우드 자체의 보안을 책임지고 고객은 클라우드 안의 보안을 책임집니다. IaaS인 EC2는 게스트 OS 패치, 설치한 소프트웨어, 보안 그룹 설정이 고객 몫이고, S3 같은 추상화된 서비스는 OS와 플랫폼을 AWS가 운영하므로 고객은 데이터, 암호화 옵션, IAM 권한을 관리합니다.

(공식 문서) AWS의 클라우드 유형 페이지는 IaaS를 네트워크·컴퓨터·저장소 같은 기본 구성 요소, PaaS를 하드웨어와 운영체제 같은 기반 관리를 없애 주는 것, SaaS를 공급자가 운영·관리하는 소프트웨어로 설명한다. 정의는 회사마다 다르다는 단서도 붙인다.
(공식 문서) 공동 책임 모델 페이지는 AWS를 클라우드의 보안(인프라 전체), 고객을 클라우드 안의 보안으로 나눈다. EC2는 IaaS라서 게스트 OS(패치 포함), 설치 소프트웨어, 보안 그룹 설정이 고객 책임이고, S3와 DynamoDB 같은 추상화된 서비스는 AWS가 인프라·OS·플랫폼을 운영하고 고객이 데이터(암호화 옵션 포함)와 IAM 권한을 관리한다고 한다. 패치 관리와 구성 관리는 양쪽이 각자의 계층을 맡는 공유 통제의 예로 든다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
