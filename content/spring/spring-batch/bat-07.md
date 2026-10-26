---
slug: "bat-07"
topic: "spring-batch"
tier: BASIC
difficulty: 2
title: "Spring Batch가 DB에 만드는 메타데이터 테이블은 무엇이고 왜 필요한가요?"
keywords: ["잡 실행 이력 저장", "BATCH_JOB_INSTANCE·EXECUTION·STEP_EXECUTION", "ExecutionContext 저장", "재시작 판단 근거", "6.0 기본은 리소스리스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/schema-appendix.html", "https://docs.spring.io/spring-batch/reference/job/configuring-repository.html", "https://docs.spring.io/spring-batch/reference/whatsnew.html"]
concepts: [batch-job-metadata]
importance: 1
links: [{to: "bat-02", kind: PREREQ}, {to: "bat-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
잡 실행 이력을 저장하는 테이블들입니다. JobInstance, JobExecution, JobParameters, StepExecution이 각각 `BATCH_JOB_INSTANCE`, `BATCH_JOB_EXECUTION`, `BATCH_JOB_EXECUTION_PARAMS`, `BATCH_STEP_EXECUTION`에 대응하고, ExecutionContext는 잡용과 스텝용 컨텍스트 테이블에 저장됩니다. 프레임워크는 이 기록으로 같은 잡이 이미 실행됐는지, 어디까지 진행했는지 판단해 재시작합니다. 참고로 6.0의 기본 구성(`@EnableBatchProcessing`, `DefaultBatchConfiguration`)이 제공하는 저장소는 DB를 쓰지 않는 리소스리스 구현이라서, 재시작이 필요하면 JDBC 저장소를 따로 설정해야 합니다.

(공식 문서) Meta-Data Schema 부록은 JobInstance, JobExecution, JobParameters, StepExecution이 위 네 테이블에, ExecutionContext가 `BATCH_JOB_EXECUTION_CONTEXT`와 `BATCH_STEP_EXECUTION_CONTEXT`에 대응한다고 하며 모두 여섯 개 테이블이다. 프레임워크가 메타데이터 테이블로 한 JobInstance가 이전에 실행된 적이 있는지 판단하고(재시작 불가 잡이면 예외), 재시작 때 ExecutionContext에서 상태를 복원한다고 한다. 여러 프로세스가 같은 테이블을 쓰기 때문에 version 컬럼으로 낙관적 락을 쓰고 충돌 시 OptimisticLockingFailureException이 난다.
(공식 문서) Configuring a JobRepository 페이지는 ResourcelessJobRepository가 배치 메타데이터를 저장하지 않으며 재시작이 필요 없는 경우를 위한 것이고, @EnableBatchProcessing이나 DefaultBatchConfiguration을 쓰면 기본으로 제공된다고 한다. DB 기반 저장소는 @EnableJdbcJobRepository 등으로 설정한다.
(실험하지 않았다) 문서 근거로만 썼다. Spring Boot 자동 구성이 고르는 저장소는 확인하지 않았다.
