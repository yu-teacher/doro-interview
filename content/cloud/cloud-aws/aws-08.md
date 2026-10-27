---
slug: "aws-08"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "EBS 볼륨과 인스턴스 스토어는 어떻게 다르고, 인스턴스를 중지·종료하면 데이터는 어떻게 되나요?"
keywords: ["EBS는 지속형 블록 스토리지", "인스턴스 스토어는 임시 데이터", "중지하면 인스턴스 스토어 삭제", "종료 시 루트 볼륨 기본 삭제", "스냅샷으로 백업"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html", "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/RootDeviceStorage.html"]
concepts: [cloud-storage]
importance: 2
links: [{to: "aws-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
EBS는 인스턴스에 연결해 로컬 디스크처럼 쓰는 지속형 블록 스토리지로, 인스턴스와 별개로 유지되고 스냅샷으로 시점 백업을 만들 수 있습니다. 반대로 인스턴스 스토어는 임시 데이터용이라 인스턴스를 중지, 최대 절전, 종료하면 내용이 지워지고 재부팅만 보존됩니다. EBS 루트 볼륨을 쓰는 인스턴스는 중지했다가 다시 시작해도 볼륨의 데이터가 유지됩니다. 종료할 때는 `DeleteOnTermination` 속성에 따라 달라지는데, 기본값은 루트 볼륨은 삭제하고 추가로 붙인 볼륨은 보존하는 것입니다. 그래서 잃으면 안 되는 데이터는 EBS나 S3에 두고 스냅샷 같은 백업을 따로 둡니다.

(공식 문서) EBS 페이지는 EBS 볼륨을 인스턴스에 붙여 로컬 드라이브처럼 쓰는 스토리지, 스냅샷을 볼륨과 독립적으로 유지되는 시점 백업이라고 설명한다. 볼륨 데이터는 한 가용 영역 안에서 여러 서버에 자동 복제되며, 스냅샷은 계정·리전·가용 영역 사이로 데이터를 옮기는 데도 쓸 수 있다고 한다.
(공식 문서) EC2 개념 페이지는 인스턴스 스토어 볼륨을 중지·최대 절전·종료 시 삭제되는 임시 데이터용 스토리지로 설명한다. 인스턴스 수명 주기 페이지의 비교표는 재부팅 시 인스턴스 스토어 데이터가 보존되고 중지·최대 절전·종료 시 지워진다고 하며, `DeleteOnTermination`의 기본값은 루트 볼륨 삭제, 그 밖의 EBS 볼륨 보존이라고 한다. 루트 장치 페이지는 EBS 루트 인스턴스를 중지했다 재시작해도 연결된 볼륨의 데이터에는 영향이 없다고 한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
