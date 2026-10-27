---
slug: "obs-01"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 1
title: "인프라 as 코드(IaC)란 무엇이고, 선언적 방식과 명령형 방식은 어떻게 다른가요?"
keywords: ["코드로 정의한 인프라", "선언적 최종 상태", "명령형 실행 순서", "멱등성", "버전 관리와 리뷰"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/intro", "https://developer.hashicorp.com/terraform/cli/commands/plan"]
concepts: [iac-terraform]
importance: 3
---
**모범 답변 (30~60초)**
IaC는 서버, 네트워크, DNS 같은 인프라를 콘솔에서 손으로 만들지 않고 코드 파일로 정의해서 버전 관리하고 재사용하는 방식입니다. 선언적 방식은 원하는 최종 상태를 적으면 도구가 현재 상태와 비교해 필요한 변경을 알아서 계산하고, 명령형 방식은 어떤 명령을 어떤 순서로 실행할지를 직접 적습니다. 선언적 도구는 이미 맞는 것은 건드리지 않기 때문에 같은 코드를 여러 번 적용해도 결과가 같은 멱등성을 기대할 수 있습니다. 코드로 남으니 리뷰와 이력 추적, 같은 환경의 복제도 쉬워집니다.

(공식 문서) Terraform 소개 문서는 Terraform을 클라우드와 온프레미스 리소스를 사람이 읽는 설정 파일로 정의하고 버전 관리·재사용·공유하게 해 주는 IaC 도구라고 설명한다. 설정 파일은 선언적이어서 인프라의 최종 상태를 기술하며 단계별 지시를 쓸 필요가 없고, 의존 관계는 도구가 리소스 그래프로 처리한다고 한다.
(공식 문서) `terraform plan` 문서는 변경이 필요 없다고 판단하면 취할 조치가 없다고 보고한다고 설명한다.
(보충) 멱등성이라는 용어와 명령형 방식과의 비교는 일반적으로 알려진 설명이다. 위 plan 동작을 근거로 풀어 쓴 해석이다.
계정과 `terraform` 실행 파일이 없어 실행해 보지 않았다(실험하지 않았다).
