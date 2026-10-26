---
slug: "bat-14"
topic: "spring-batch"
tier: DEEP
difficulty: 3
title: "파티셔닝(Partitioning)은 어떻게 동작하고, 멀티스레드 스텝과 무엇이 다른가요?"
keywords: ["Partitioner가 ExecutionContext 생성", "PartitionHandler와 gridSize", "워커 스텝이 각자 읽기·처리·쓰기", "파티션별 StepExecution"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/scalability.html"]
concepts: [thread-pool, batch-job-metadata]
importance: 1
links: [{to: "bat-13", kind: PREREQ}]
---
**모범 답변 (30~60초)**
파티셔닝은 매니저 스텝이 입력을 여러 조각으로 나누고, 같은 구성의 워커 스텝들이 각 조각을 독립적으로 처리하게 하는 방식입니다. Partitioner가 파티션 이름과 입력 범위(기본 키 범위나 파일 경로)를 담은 ExecutionContext 맵을 만들고, PartitionHandler가 이를 워커 스텝 실행으로 보내며, gridSize가 만들 파티션 수의 기준입니다. 파티션마다 StepExecution이 따로 남습니다. 멀티스레드 스텝은 한 스텝 안에서 프로세서만 여러 스레드가 돌리고 읽기와 쓰기는 메인 스레드가 하지만, 파티셔닝은 워커마다 읽기·처리·쓰기를 따로 합니다.

(공식 문서) Scaling and Parallel Processing 페이지는 파티셔닝이 매니저 역할 스텝과 동일한 워커 스텝 인스턴스로 구성되고, PartitionStep과 PartitionHandler, StepExecutionSplitter가 SPI라고 설명한다. Partitioner는 새 스텝 실행의 입력인 ExecutionContext 맵을 만들며 키는 스텝 실행 이름(예: step1:partition0)이고 값에 기본 키 범위, 줄 번호, 파일 위치 같은 입력을 넣을 수 있다고 한다. gridSize는 만들 스텝 실행 수를 정하며 TaskExecutorPartitionHandler는 로컬 스레드로 워커를 돌린다. 워커 메타데이터는 JobRepository가 관리해 파티션이 한 번씩만 실행되며, 잡을 재시작하면 실패한 스텝만 다시 실행된다고 한다. 같은 페이지의 멀티스레드 스텝 절은 읽기와 쓰기를 메인 스레드가 직렬로 하고 프로세서가 여러 스레드에서 호출된다고 한다.
(실험하지 않았다) 문서 근거로만 썼다.
