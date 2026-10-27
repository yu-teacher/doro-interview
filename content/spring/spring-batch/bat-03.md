---
slug: "bat-03"
topic: "spring-batch"
tier: BASIC
difficulty: 2
title: "JobInstance, JobExecution, StepExecution은 각각 무엇이 다른가요?"
keywords: ["JobInstance는 논리적 실행", "JobExecution은 한 번의 시도", "StepExecution은 스텝 실행 기록", "Job 이름과 식별 파라미터"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/domain.html"]
concepts: [batch-job-metadata]
importance: 2
links: [{to: "bat-02", kind: PREREQ}, {to: "bat-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
JobInstance는 논리적인 한 번의 잡 실행으로, Job 이름과 식별 파라미터의 조합입니다. 하루에 한 번 도는 정산 잡이라면 날짜별로 인스턴스가 하나씩 생깁니다. JobExecution은 그 인스턴스를 실제로 돌려 보는 한 번의 시도입니다. 실패해서 같은 파라미터로 다시 돌리면 인스턴스는 그대로고 실행만 새로 생깁니다. StepExecution은 Step을 한 번 실행한 기록으로, 읽기·쓰기·커밋·롤백·스킵 건수와 ExecutionContext를 가집니다. 인스턴스는 성공한 실행이 나와야 완료로 칩니다.

(공식 문서) Domain Language 페이지는 JobInstance를 논리적인 잡 실행, JobExecution을 한 번의 실행 시도로 정의한다. 실행은 실패나 성공으로 끝날 수 있지만 인스턴스는 실행이 성공해야 완료로 간주되고, 하나의 인스턴스가 여러 실행을 가질 수 있으며 같은 인스턴스는 동시에 하나만 실행된다고 한다. 같은 인스턴스를 이미 실행 중일 때 다시 실행하면 JobExecutionAlreadyRunningException이 난다. StepExecution은 Step을 실제로 시작할 때 만들어지고(앞 단계 실패로 시작되지 못한 Step은 저장되지 않는다), 읽기·쓰기·커밋·롤백·스킵·필터 건수를 가진다.
(실험하지 않았다) 문서 근거로만 썼다.
