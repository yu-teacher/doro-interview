---
slug: "obs-17"
topic: "cloud-iac-observability"
tier: TRICKY
difficulty: 2
title: "누군가 콘솔에서 Terraform이 관리하는 리소스 설정을 직접 바꿨습니다. 다음 `terraform apply`는 어떻게 동작하나요?"
keywords: ["plan이 실제 상태를 먼저 갱신", "설정에 맞추려는 되돌림", "드리프트", "refresh-only로 state만 동기화", "ignore_changes"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/cli/commands/plan", "https://developer.hashicorp.com/terraform/tutorials/state/refresh", "https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle"]
concepts: [iac-terraform]
importance: 1
---
**모범 답변 (30~60초)**
plan과 apply는 먼저 실제 인프라를 읽어 state를 최신으로 맞춘 뒤 설정과 비교합니다. 그래서 콘솔에서 수동으로 바꾼 값이 설정 파일에 반영돼 있지 않다면, 설정에 맞추기 위해 그 변경을 되돌리는 계획이 나옵니다. 이런 차이를 드리프트라고 합니다. 장애 대응 중 일부러 바꾼 것이라면 `-refresh-only` 모드로 state만 실제에 맞출 수 있는데, 이것은 설정 파일을 고쳐 주지는 않으므로 코드도 따로 수정해야 합니다. 외부 프로세스가 계속 바꾸는 속성은 `ignore_changes`로 계획에서 뺄 수 있습니다.

(공식 문서) `terraform plan` 문서는 기본 plan이 원격 객체의 현재 상태를 읽어 state를 최신으로 만든 뒤 설정과 비교해 설정에 맞추기 위한 변경을 제안한다고 한다. refresh-only 모드는 Terraform 밖에서 바뀐 것을 state와 출력값에만 반영하며, 장애 대응 중 일부러 바꾼 경우에 쓸 수 있다고 한다. 이 모드는 v0.15.4 이상에서 쓸 수 있다.
(공식 문서) refresh 튜토리얼은 plan과 apply가 암묵적으로 메모리 안에서 refresh를 수행해 드리프트를 반영한다고 하고, refresh-only plan은 Terraform이 이를 되돌리는 조치를 하지 않고 state만 갱신한다고 보여 준다. lifecycle 문서는 `ignore_changes`가 Terraform 밖의 프로세스가 바꾸는 속성을 계획에서 무시하게 해 책임을 나누게 한다고 설명한다.
(보충) refresh-only가 설정 파일을 고쳐 주지 않으므로 코드도 따로 수정해야 한다는 부분과, 적용한 뒤 설정 파일을 그대로 두면 다음 일반 plan에서 다시 설정 쪽으로 되돌리는 변경이 나온다는 부분은 위 설명에서 추론한 것이다. 실제로 실행해 보지 않았다(실험하지 않았다).
