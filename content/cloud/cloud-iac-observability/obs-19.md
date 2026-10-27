---
slug: "obs-19"
topic: "cloud-iac-observability"
tier: TRICKY
difficulty: 3
title: "리소스에 `prevent_destroy = true`를 걸어 두면, 설정에서 그 리소스 블록을 지워도 삭제가 막히나요?"
keywords: ["destroy를 포함한 plan을 거부", "설정에서 블록을 지우면 막지 못함", "state에 기록되지 않는 규칙", "terraform destroy도 막힘", "DB 같은 상태 저장 리소스에 아껴서 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle"]
concepts: [iac-terraform]
importance: 1
---
**모범 답변 (30~60초)**
막히지 않습니다. `prevent_destroy`는 그 리소스를 파괴하는 계획이 나오면 오류로 거부하는 안전장치인데, 규칙이 설정 파일 안에 있어야만 동작합니다. 리소스 블록 자체를 설정에서 지우면 규칙도 함께 사라지고, `prevent_destroy`는 state에 기록되지 않으므로 그대로 실제 인프라가 삭제됩니다. 반대로 이 규칙이 있으면 `terraform destroy`까지 막혀서 일부 변경을 적용할 수 없게 되기도 합니다. 그래서 데이터베이스처럼 되돌리기 비싼 상태 저장 리소스에만 아껴서 쓰고, 설정에서 빼면서 삭제를 피하려면 state에서 먼저 제거해야 합니다.

(공식 문서) lifecycle 참조 문서는 `prevent_destroy`가 true이면 해당 리소스의 인프라 객체를 파괴하는 plan을 오류로 거부하며 인자가 설정에 있어야 한다고 한다. 이 규칙은 리소스 설정을 지우는 경우에는 파괴를 막지 못한다고 하고, 데이터베이스나 스토리지처럼 재현 비용이 큰 리소스를 실수로 교체하는 것을 막는 용도로 쓰되 변경이 불가능해지고 `terraform destroy`를 막기도 하니 드물게 쓰라고 한다.
(공식 문서) 같은 문서는 `create_before_destroy`를 제외한 lifecycle 규칙을 state에 명시적으로 기록하지 않아서 설정에서 리소스를 지우면 `prevent_destroy`가 있어도 실제 인프라를 파괴한다고 하며, 실제 리소스를 파괴하지 않고 state에서 제거하는 방법은 별도의 'Remove a resource from state' 문서를 참조하라고 한다.
실제 실행으로 확인하지 못했다(실험하지 않았다).
