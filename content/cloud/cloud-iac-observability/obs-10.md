---
slug: "obs-10"
topic: "cloud-iac-observability"
tier: DEEP
difficulty: 2
title: "`terraform apply` 전에 plan 결과를 리뷰하는 이유는 무엇이고, plan을 파일로 저장해 적용하는 방식은 언제 쓰나요?"
keywords: ["plan으로 변경 내용 미리 확인", "기대한 변경과 일치하는지 확인", "speculative plan", "-out으로 저장한 plan 적용", "apply 실패 시 자동 롤백 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://developer.hashicorp.com/terraform/cli/commands/plan", "https://developer.hashicorp.com/terraform/cli/commands/apply", "https://developer.hashicorp.com/terraform/intro"]
concepts: [iac-terraform]
importance: 2
---
**모범 답변 (30~60초)**
plan은 현재 state를 실제 인프라와 맞춰 본 뒤, 설정과 비교해 무엇을 만들고 바꾸고 지울지 미리 보여 줍니다. 적용 전에 이 변경이 의도한 것과 맞는지 확인하려고 리뷰하고, 코드 리뷰 전에도 plan으로 변경 효과를 미리 볼 수 있습니다. 파일로 저장하지 않은 plan은 적용 의도가 없는 미리보기라서, 그 사이 다른 변경이 있으면 결과가 달라질 수 있어 적용 직전의 plan을 다시 확인해야 합니다. `-out`으로 저장한 plan을 `apply`에 넘기는 방식은 주로 자동화에서 쓰며, 이때는 확인 질문 없이 저장된 내용 그대로 실행됩니다. apply가 중간에 실패해도 자동으로 되돌려 주지는 않습니다.

(공식 문서) `terraform plan` 문서는 plan이 현재 상태를 읽어 최신으로 만들고, 설정과 이전 state의 차이를 비교해, 설정에 맞추기 위한 변경 계획을 제안한다고 한다. `-out=FILE` 없이 만든 plan은 speculative plan이고 코드 리뷰 전에 변경 효과를 확인하는 데 쓸 수 있지만 그사이 다른 변경으로 결과가 달라질 수 있으니 적용 전 최종 plan을 다시 확인하라고 한다. `-out`으로 저장해 apply에 넘기는 두 단계 방식은 주로 자동화에서 쓴다고 한다. `terraform apply` 문서는 저장된 plan 파일을 넘기면 확인 없이 그 내용을 실행하며, 파일을 넘기는 행위를 승인으로 본다고 설명한다.
(공식 문서) `terraform apply` 문서는 apply 중 오류가 나면 Terraform이 부분 완료된 apply를 자동으로 롤백하지 않으며, 오류를 해결한 뒤 다시 apply해야 한다고 한다. 소개 문서는 변경 전에 plan을 만들고 승인을 받는다고 한다.
실제 plan을 돌려 보지 않았다(실험하지 않았다).
