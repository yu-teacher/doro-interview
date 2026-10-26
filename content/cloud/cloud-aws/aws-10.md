---
slug: "aws-10"
topic: "cloud-aws"
tier: DEEP
difficulty: 2
title: "S3 스토리지 클래스에는 어떤 것이 있고, 어떤 기준으로 고르며 수명 주기 규칙은 어떻게 쓰나요?"
keywords: ["Standard는 기본 클래스", "Standard-IA와 One Zone-IA", "Glacier 계열 장기 보관", "Intelligent-Tiering 자동 이동", "수명 주기 전환·만료 규칙"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html", "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html"]
concepts: [high-availability]
importance: 1
links: [{to: "aws-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
접근 빈도와 복구 속도로 고릅니다. 기본값인 S3 Standard는 자주 접근하는 데이터용입니다. Standard-IA와 One Zone-IA는 드물게 접근하지만 밀리초 단위로 꺼내야 하는 데이터용이라 조회 수수료가 붙고, One Zone-IA는 가용 영역 한 곳에만 저장해서 그 영역이 물리적으로 사라지면 복원되지 않습니다. Glacier Instant Retrieval, Flexible Retrieval, Deep Archive는 거의 접근하지 않는 장기 보관용이고, 뒤의 둘은 실시간으로 읽을 수 없는 아카이브입니다. 접근 패턴을 모르면 Intelligent-Tiering이 객체를 자동으로 옮겨 줍니다. 수명 주기 규칙으로 일정 기간이 지난 객체의 클래스를 전환하거나 만료시켜 삭제할 수 있습니다.

(공식 문서) 스토리지 클래스 페이지는 S3 Standard를 기본 클래스로, Standard-IA와 One Zone-IA를 드물게 접근하지만 밀리초 접근이 필요한 장기 데이터용으로 설명한다. 이 둘은 조회 수수료가 있고 128KB 이상 객체를 최소 30일 보관하는 용도에 맞으며, One Zone-IA는 한 가용 영역에만 저장돼 영역 손실에 복원력이 없다고 한다. Glacier Instant Retrieval은 밀리초 검색이 가능하고, Flexible Retrieval과 Deep Archive는 실시간 접근이 안 되는 아카이브라고 한다. Intelligent-Tiering은 접근 패턴이 불명확하거나 변할 때 객체를 자동 이동하며 조회 수수료가 없다고 한다.
(공식 문서) 수명 주기 페이지는 수명 주기 구성이 전환 작업(예: 30일 뒤 Standard-IA로)과 만료 작업(S3가 대신 삭제)으로 이뤄지고, 기존 객체와 이후 추가되는 객체 모두에 적용된다고 한다. 각 클래스의 가용성·내구성 수치와 가격은 바뀔 수 있어 문서를 확인해야 한다.
실험하지 않았다. 클라우드 계정이 없어 문서 근거로만 썼다.
