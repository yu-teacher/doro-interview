---
slug: "obs-02"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 1
title: "Terraform의 기본 작업 흐름(write, plan, apply)과 provider, resource는 각각 무엇인가요?"
keywords: ["write plan apply 세 단계", "provider는 API를 다루는 플러그인", "resource는 관리할 인프라 객체", "init으로 provider 설치", "승인 후 apply"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/intro", "https://developer.hashicorp.com/terraform/language/resources/behavior", "https://developer.hashicorp.com/terraform/tutorials/state/refresh"]
concepts: [iac-terraform]
importance: 3
---
**모범 답변 (30~60초)**
Terraform의 기본 흐름은 세 단계입니다. 먼저 write에서 설정 파일에 리소스를 정의하고, plan에서 현재 상태와 설정을 비교해 무엇을 만들고 바꾸고 지울지 실행 계획을 보여 주며, 승인하면 apply에서 의존 관계를 지키며 실제로 실행합니다. resource는 가상 네트워크나 인스턴스, DNS 레코드처럼 관리할 인프라 객체이고, provider는 클라우드 같은 플랫폼의 API를 호출해 그 리소스 종류를 제공하는 플러그인입니다. 새 프로젝트에서는 provider를 내려받도록 먼저 `terraform init`을 실행합니다.

(공식 문서) Terraform 소개 문서가 핵심 워크플로를 Write, Plan, Apply 세 단계로 설명하고, Terraform이 각 플랫폼의 API를 통해 리소스를 만들고 관리하며 provider가 그 연결을 가능하게 한다고 한다.
(공식 문서) 리소스 관리 개요 문서는 resource를 가상 네트워크, 컴퓨트 인스턴스 같은 관리 대상 인프라 객체로, provider를 한 플랫폼의 리소스 타입을 제공하는 플러그인으로 정의한다. 새 프로젝트나 provider·module을 바꾼 프로젝트는 먼저 워크스페이스를 초기화해야 한다고 한다. 명령 이름이 `terraform init`인 것은 state 새로고침 튜토리얼의 실행 예에서 확인했다.
실제 클라우드 계정이 없어 plan과 apply를 실행해 보지 않았다(실험하지 않았다).
