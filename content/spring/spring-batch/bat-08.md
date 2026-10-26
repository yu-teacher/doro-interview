---
slug: "bat-08"
topic: "spring-batch"
tier: DEEP
difficulty: 2
title: "JobParameters는 JobInstance를 어떻게 결정하고, 같은 파라미터로 다시 실행하면 어떻게 되나요?"
keywords: ["JobInstance = Job + 식별 파라미터", "identifying 여부", "실패 실행은 재시작", "COMPLETED면 재시작 불가", "startNextInstance와 incrementer"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/domain.html", "https://docs.spring.io/spring-batch/reference/schema-appendix.html", "https://docs.spring.io/spring-batch/reference/step/controlling-flow.html", "https://docs.spring.io/spring-batch/reference/job/configuring-job.html", "https://docs.spring.io/spring-batch/reference/job/advanced-meta-data.html", "https://docs.spring.io/spring-boot/how-to/batch.html"]
concepts: [batch-job-metadata, idempotency]
importance: 2
links: [{to: "bat-03", kind: PREREQ}, {to: "bat-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
문서의 정의는 JobInstance가 Job과 식별(identifying) JobParameters의 조합이라는 것입니다. 파라미터는 기본적으로 식별에 참여하고, 식별에 쓰지 않는 파라미터를 따로 지정할 수도 있습니다. 같은 식별 파라미터로 다시 실행하면 새 인스턴스가 아니라 기존 인스턴스의 새 실행이라서, 이전 실행이 실패했다면 재시작으로 이어서 처리합니다. 반대로 COMPLETED로 끝난 잡은 재시작할 수 없어 예외가 납니다. 처음부터 새로 돌리려면 파라미터를 바꾸거나 JobParametersIncrementer와 `startNextInstance`로 다음 인스턴스를 만듭니다.

(공식 문서) Domain Language 페이지는 JobInstance = Job + 식별 JobParameters이고 모든 파라미터가 기본으로 식별에 기여하지만 식별에 참여하지 않는 파라미터도 제출할 수 있다고 한다. Meta-Data Schema 부록은 파라미터 테이블의 IDENTIFYING 플래그와 인스턴스 테이블의 `JOB_KEY`(JobParameters의 직렬화)를 설명한다. Controlling Step Flow 페이지는 COMPLETED로 끝난 잡은 재시작할 수 없고 프레임워크가 JobInstanceAlreadyCompleteException을 던진다고 한다. Configuring a Job 페이지는 JobExecution이 이미 있는 JobInstance로 시작하는 것이 재시작이고 preventRestart를 주면 JobRestartException이 난다고 한다. Advanced Metadata Usage 페이지는 `startNextInstance`가 JobParametersIncrementer로 항상 새 인스턴스를 시작한다고 한다.
(공식 문서) Spring Boot how-to는 실패한 잡을 재시작하려면 식별·비식별 파라미터를 모두 다시 지정해야 하고 비식별 파라미터는 이전 실행에서 복사되지 않는다고 한다.
(실험하지 않았다) 문서 근거로만 썼다.
