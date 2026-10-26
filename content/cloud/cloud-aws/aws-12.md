---
slug: "aws-12"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "S3 버킷에 대한 접근은 어떻게 제어하고, 파일을 임시로 공유하려면 어떻게 하나요?"
keywords: ["기본은 비공개", "버킷 정책은 리소스 기반 정책", "IAM 정책", "퍼블릭 액세스 차단", "프리사인드 URL로 임시 접근", "ACL 대신 정책 권장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html"]
concepts: [cloud-iam]
importance: 2
links: [{to: "aws-09", kind: PREREQ}, {to: "aws-15", kind: RELATED}, {to: "aws-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
버킷과 객체는 기본적으로 비공개라서 권한을 명시해야 접근할 수 있습니다. 접근 제어에는 IAM 정책, 버킷 정책, 액세스 포인트 정책, ACL을 쓰는데, 공식 문서는 ACL보다 버킷 정책 같은 리소스 기반 정책이나 IAM 정책을 쓰라고 권고하고 새 버킷은 ACL이 비활성화된 상태가 기본입니다. 버킷 정책은 요청자, 작업, 리소스, IP 같은 조건을 담은 JSON 정책이라서 다른 계정에 권한을 주는 데도 씁니다. 퍼블릭 액세스 차단 설정은 특별히 필요한 경우가 아니면 모두 켜 두라고 권고합니다. 임시 공유에는 프리사인드 URL을 만들어 정해진 시간 동안 특정 객체의 다운로드나 업로드를 허용합니다.

(공식 문서) S3 소개 페이지는 버킷과 객체가 기본적으로 비공개이고 버킷 정책, IAM 정책, ACL, 액세스 포인트로 접근을 관리한다고 하며, ACL보다 리소스 기반 정책이나 IAM 사용자 정책을 권장한다. 퍼블릭 액세스 차단 설정은 버킷 수준에서 기본으로 켜져 있고 필요하지 않으면 모두 켜 두라고 권고한다.
(공식 문서) 버킷 정책 페이지는 버킷 정책이 리소스 기반 정책이고 버킷 소유자만 붙일 수 있으며 JSON 정책 언어로 요청자·작업·IP 같은 조건에 따라 허용·거부한다고 한다. 객체 소유권 기본값은 버킷 소유자 강제로 ACL이 비활성화되어 있다. 프리사인드 URL 페이지는 정책을 바꾸지 않고 시간 제한 접근을 주는 방법이며, URL을 만든 IAM 주체의 자격 증명을 쓰고 그 주체에게 해당 작업 권한이 있어야 동작하며, 임시 자격 증명으로 만들면 그 자격 증명보다 오래 유효할 수 없다고 한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
