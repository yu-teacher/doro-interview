---
slug: "obs-18"
topic: "cloud-iac-observability"
tier: TRICKY
difficulty: 3
title: "Terraform 변수에 `sensitive = true`를 붙이면 비밀번호가 state에 저장되지 않나요?"
keywords: ["CLI 출력에서만 가려진다", "state와 plan 파일에는 저장", "접근 제어가 있는 원격 state", "ephemeral 값은 저장 안 함", "terraform output -json은 평문"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/language/manage-sensitive-data", "https://developer.hashicorp.com/terraform/language/state"]
concepts: [iac-terraform]
importance: 1
links: [{to: "k8s-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. `sensitive = true`는 plan과 apply 출력, 로그, HCP Terraform 화면에서 값을 가려 줄 뿐이고, 값 자체는 state 파일과 plan 파일에 그대로 저장됩니다. 그래서 그 파일에 접근할 수 있는 사람은 비밀값을 볼 수 있고, `terraform output -json`이나 `-raw`는 민감한 출력도 평문으로 보여 줍니다. 저장 자체를 피하려면 Terraform 1.10 이상의 `ephemeral` 값이나 1.11 이상의 write-only 인자를 쓰는데, 지원 여부는 provider마다 다릅니다. 그리고 state는 접근 제어가 있는 원격 백엔드에 두고 Git에는 올리지 않습니다.

(공식 문서) 민감 데이터 관리 문서는 `sensitive` 인자가 CLI 로그 출력과 HCP Terraform UI에서 값을 가리고, 이를 참조하는 표현식도 민감한 것으로 취급하지만 값은 state와 plan 파일에 저장되어 파일에 접근할 수 있는 누구나 볼 수 있다고 한다. `terraform output`의 `-json`이나 `-raw`는 민감한 값을 평문으로 보여 준다고 하며, state를 보호하라고 권고한다.
(공식 문서) 같은 문서는 ephemeral 값은 state와 plan에서 빠지고, 요구 버전은 `ephemeral`이 Terraform 1.10 이상, write-only 인자는 1.11 이상이며 각 provider가 지원 범위를 정한다고 한다. state 문서는 버전 관리처럼 잠금과 접근 제어가 없는 곳에 state를 두는 것을 피하라고 한다.
실제로 state 파일을 열어 보지 않았다(실험하지 않았다).
