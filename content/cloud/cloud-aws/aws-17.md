---
slug: "aws-17"
topic: "cloud-aws"
tier: TRICKY
difficulty: 3
title: "IAM 정책에서 허용(Allow)과 거부(Deny)가 충돌하면 어떻게 판단하고, 권한 경계나 SCP가 걸려 있으면 어떻게 달라지나요?"
keywords: ["명시적 거부가 허용을 덮어씀", "ID 기반과 리소스 기반의 합집합", "권한 경계는 교집합", "SCP는 최대 권한 제한", "같은 계정에서 한쪽만 허용해도 허용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-basics.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html"]
concepts: [cloud-iam]
importance: 1
links: [{to: "aws-15", kind: PREREQ}]
---
**모범 답변 (30~60초)**
적용되는 정책 중 어느 하나라도 명시적 Deny가 있으면 다른 정책의 Allow를 덮어쓰고 거부됩니다. 같은 계정에서 ID 기반 정책과 리소스 기반 정책이 함께 있으면 두 정책이 준 권한의 합집합이 되어, 한쪽만 허용해도 요청이 허용됩니다. 반면 권한 경계가 있으면 ID 기반 정책과 경계의 교집합만 유효해집니다. 조직의 SCP도 계정 안 사용자와 역할의 최대 권한을 정하므로, 리소스 기반 정책이 없는 요청은 사용자 정책, SCP, RCP가 모두 허용해야 합니다. 그래서 정책에 Allow를 썼는데 거부된다면 Deny 문장이나 권한 경계, SCP부터 의심합니다. 어디에서도 허용하지 않은 요청은 기본적으로 암묵적으로 거부되고, 루트 사용자만 예외입니다.

(공식 문서) 정책 평가 논리 페이지는 같은 계정에서 ID 기반과 리소스 기반 정책의 권한이 합집합이며 어느 한쪽이 허용하면 허용되고, 둘 중 하나의 명시적 거부가 허용을 덮어쓴다고 한다. 권한 경계가 있으면 ID 기반 정책과 경계의 교집합이고, 조직 구성원이 리소스 기반 정책 없는 리소스에 접근하면 사용자 정책·SCP·RCP의 교집합이므로 셋 모두 허용해야 한다고 한다. 어느 정책 유형의 명시적 거부든 허용을 덮어쓴다.
(공식 문서) 정책 평가 기본 페이지는 같은 계정에서 AWS가 먼저 Deny 문장을 확인하고 없으면 권한 정책에서 허용을 찾는 순서의 예를 든다. 같은 계정이면 ID 기반과 리소스 기반 중 한쪽만 허용해도 요청이 허용된다고 강조한다.
(공식 문서) 정책 평가 로직의 집행 코드 페이지는 기본적으로 모든 요청이 암묵적으로 거부되며 루트 사용자만 예외이고, 적용되는 정책에서 명시적 Deny를 하나라도 찾으면 최종 결정이 거부라고 한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
