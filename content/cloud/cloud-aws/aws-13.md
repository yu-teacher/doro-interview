---
slug: "aws-13"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "RDS의 다중 AZ 배포와 읽기 전용 복제본은 무엇이 다른가요?"
keywords: ["다중 AZ는 고가용성", "동기 복제 대기 인스턴스", "대기 인스턴스는 읽기 불가", "읽기 복제본은 비동기 복제", "읽기 부하 분산"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html"]
concepts: [high-availability, db-scaling]
importance: 3
links: [{to: "aws-14", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
목적이 다릅니다. 다중 AZ 배포는 고가용성을 위한 것으로, 다른 가용 영역에 동기식으로 복제되는 대기 인스턴스를 두고 장애가 나면 거기로 자동 전환합니다. 다중 AZ DB 인스턴스 배포의 대기 인스턴스는 읽기 트래픽을 처리하지 못해서 읽기 확장 수단이 아니고, 동기 복제 때문에 쓰기와 커밋 지연이 늘 수 있습니다. 읽기 전용 복제본은 읽기 부하를 나누기 위한 것으로, 원본의 변경을 비동기로 복사한 읽기 전용 사본이라 원본이 불가용할 때처럼 최신 데이터가 아닐 수도 있고, 애플리케이션이 읽기 쿼리를 복제본으로 직접 보내야 합니다. 둘은 함께 쓸 수 있고, 읽기도 되는 대기 인스턴스가 둘인 다중 AZ DB 클러스터 배포라는 변형도 있습니다.

(공식 문서) 다중 AZ 페이지는 대기 인스턴스가 하나인 다중 AZ DB 인스턴스 배포(대기가 읽기 트래픽을 처리하지 않음)와 대기가 둘인 다중 AZ DB 클러스터 배포(대기가 읽기도 처리)를 구분한다. DB 인스턴스 배포 페이지는 다른 가용 영역에 동기식 대기 복제본을 두고, 고가용성 옵션은 읽기 확장 해법이 아니며 동기 복제로 쓰기·커밋 지연이 늘 수 있다고 한다.
(공식 문서) 읽기 복제본 페이지는 읽기 복제본을 읽기 전용 사본으로 설명하고, 원본의 갱신을 비동기로 복사하며, 원본이 불가용할 때 읽기를 받는 경우 데이터가 오래됐을 수 있다고 한다(복제 지연을 직접 설명하는 문장은 이 페이지에 없다). 애플리케이션이 쿼리를 복제본으로 보내는 방식으로 쓰고, 복제본에도 일반 DB 인스턴스처럼 접속한다고 한다. 읽기 복제본은 직접 만들어야 하고 RDS가 자동 확장하지 않는다. 다중 AZ 배포에 읽기 복제본을 함께 구성할 수 있다. 엔진별 차이는 읽지 않았다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
