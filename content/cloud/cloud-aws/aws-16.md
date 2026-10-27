---
slug: "aws-16"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "EC2에서 도는 애플리케이션이 S3에 접근해야 할 때 액세스 키를 코드에 넣지 않고 어떻게 하나요?"
keywords: ["IAM 역할을 인스턴스에 연결", "인스턴스 프로파일", "임시 자격 증명 자동 취득", "SDK가 자격 증명 탐색", "역할에 최소 권한 정책"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html", "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html"]
concepts: [cloud-iam]
importance: 3
links: [{to: "aws-15", kind: PREREQ}, {to: "k8c-05", kind: RELATED}, {to: "cic-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
IAM 역할을 만들어 EC2 인스턴스에 연결합니다. 역할에는 EC2 서비스가 이 역할을 맡을 수 있다는 설정과, 필요한 버킷과 작업만 허용하는 최소 권한 정책을 둡니다. EC2는 인스턴스 프로파일이라는 컨테이너로 역할을 인스턴스에 전달하는데, 콘솔에서 역할을 만들면 같은 이름의 인스턴스 프로파일이 자동으로 생기고 CLI나 API에서는 따로 만듭니다. 그러면 인스턴스의 애플리케이션이 임시 자격 증명을 받아 쓰고, AWS SDK로 작성한 코드는 이 자격 증명을 알아서 찾아 쓰므로 장기 액세스 키를 배포하거나 교체할 필요가 없습니다. 인스턴스에는 역할을 하나만 붙일 수 있고, 역할을 고치면 그 역할을 쓰는 모든 인스턴스에 반영됩니다.

(공식 문서) EC2용 IAM 역할 페이지는 역할을 만들고 어떤 계정이나 서비스가 맡을 수 있는지와 허용할 API 작업·리소스를 정한 뒤, 인스턴스에 역할을 지정하면 애플리케이션이 임시 자격 증명을 받아 쓴다고 설명한다. 인스턴스에는 역할을 하나만 붙일 수 있고 같은 역할을 여러 인스턴스에 붙일 수 있으며, 역할을 바꾸면 모든 인스턴스에 전파된다. 인스턴스 프로파일은 역할의 컨테이너이고 콘솔은 같은 이름으로 자동 생성한다. 최소 권한 정책을 연결하라는 권고도 있다.
(공식 문서) IAM 모범 사례 페이지는 EC2나 Lambda 같은 컴퓨팅 서비스에서는 AWS가 역할의 임시 자격 증명을 해당 리소스에 전달하고, AWS SDK로 작성한 애플리케이션이 이를 찾아 쓰므로 IAM 사용자의 장기 자격 증명을 배포할 필요가 없다고 한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
