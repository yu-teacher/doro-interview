---
slug: "bat-02"
topic: "spring-batch"
tier: BASIC
difficulty: 1
title: "Spring Batch의 Job, Step, JobRepository, JobOperator는 각각 무엇이고 어떻게 연결되나요?"
keywords: ["Job은 Step의 컨테이너", "Step의 Reader·Processor·Writer", "JobRepository가 메타데이터 저장", "JobOperator로 시작·중지·재시작"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/domain.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [batch-job-metadata]
importance: 2
links: [{to: "bat-01", kind: PREREQ}, {to: "bat-03", kind: FOLLOWUP}, {to: "bat-07", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Job은 배치 작업 전체를 담는 단위로, 이름과 순서가 정해진 Step들, 재시작 가능 여부 같은 설정을 가집니다. Step은 Job 안의 독립적인 순차 단계이고, 청크 방식이면 ItemReader 하나, 선택적인 ItemProcessor, ItemWriter 하나로 구성됩니다. JobRepository는 실행 정보, 즉 메타데이터를 저장하고 불러오는 저장소이고, JobOperator가 Job을 시작·중지·재시작하는 진입점입니다. 그래서 JobOperator가 Job을 실행하면 그 진행 상태를 JobRepository가 계속 기록하는 구조입니다.

(공식 문서) The Domain Language of Batch 페이지가 Job을 Step들의 컨테이너로 보고 이름, Step의 정의와 순서, 재시작 가능 여부를 가진다고 설명하며, 한 Step에는 ItemReader가 정확히 하나, ItemProcessor는 선택, ItemWriter가 하나 있다고 한다. 같은 페이지의 JobOperator 인터페이스는 start, startNextInstance, stop, restart, abandon을 제공하고, 실행 메타데이터는 JobRepository가 저장하고 복원한다고 한다.
(공식 문서) What's new in Spring Batch 6 페이지는 6.0부터 JobOperator가 JobLauncher를 상속해 별도의 JobLauncher 빈이 필요 없고, JobRepository가 JobExplorer를 상속한다고 설명한다. 이전 버전 자료의 JobLauncher 설명은 이 점을 감안해 읽어야 한다.
(실험하지 않았다) 문서 근거로만 썼다.
