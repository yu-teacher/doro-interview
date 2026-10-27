---
slug: "aws-15"
topic: "cloud-aws"
tier: BASIC
difficulty: 1
title: "IAM의 사용자, 역할, 정책은 각각 무엇이고 어떻게 다른가요?"
keywords: ["IAM 사용자는 장기 자격 증명", "역할은 임시 자격 증명", "누구나 맡을 수 있는 역할", "정책은 JSON 권한 문서", "최소 권한 원칙"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html"]
concepts: [cloud-iam]
importance: 3
links: [{to: "aws-16", kind: FOLLOWUP}, {to: "aws-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
IAM 사용자는 특정 사람이나 애플리케이션에 대응하는 ID로, 비밀번호나 액세스 키 같은 장기 자격 증명을 가집니다. 역할도 권한 정책이 붙은 ID지만 한 사람에게 묶이지 않고 필요한 누구나 맡을 수 있으며, 장기 자격 증명이 없고 역할을 맡을 때 임시 보안 자격 증명을 받습니다. 정책은 어떤 작업을 어떤 리소스에 어떤 조건으로 할 수 있는지 적은 JSON 권한 문서입니다. 사용자, 그룹, 역할에 붙이는 ID 기반 정책과 S3 버킷 같은 리소스에 붙이는 리소스 기반 정책이 있습니다. 공식 문서는 사람은 페더레이션으로 임시 자격 증명을 쓰고 워크로드는 역할을 쓰라고 권고하며, 필요한 권한만 주는 최소 권한을 원칙으로 삼습니다.

(공식 문서) IAM 사용자 페이지는 IAM 사용자를 사람이나 워크로드를 나타내는, 이름과 자격 증명으로 이루어진 개체로 설명한다.
(공식 문서) IAM 역할 페이지는 역할이 특정 한 사람에게 고유하게 연결되지 않고 필요한 누구나 맡을 수 있으며, 비밀번호나 액세스 키 같은 표준 장기 자격 증명이 없고 역할을 맡으면 세션용 임시 보안 자격 증명을 받는다고 한다. 사용자는 ID 연동으로 해결되지 않는 용도에만 쓰라고 권고한다.
(공식 문서) 정책 페이지는 ID 기반 정책(관리형·인라인)을 사용자·그룹·역할이 무엇을 할 수 있는지 정하는 JSON 문서로, 리소스 기반 정책을 S3 버킷 같은 리소스에 붙이는 문서로 설명한다. 모범 사례 페이지는 사람에게는 ID 공급자 페더레이션을 통한 임시 자격 증명을, 워크로드에는 IAM 역할을 쓰고 최소 권한을 적용하라고 권고한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
