---
slug: "bat-06"
topic: "spring-batch"
tier: BASIC
difficulty: 1
title: "Spring Batch는 스케줄러인가요? 잡은 누가 언제 어떻게 실행하나요?"
keywords: ["스케줄링 프레임워크가 아님", "Quartz·Control-M 같은 외부 스케줄러", "명령줄 실행과 종료 코드", "웹 요청은 비동기 실행", "spring.batch.job.enabled"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-batch/reference/spring-batch-intro.html", "https://docs.spring.io/spring-batch/reference/job/running.html", "https://docs.spring.io/spring-batch/reference/job/configuring-operator.html", "https://docs.spring.io/spring-boot/how-to/batch.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
concepts: [batch-job-metadata]
importance: 2
links: [{to: "bat-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
아닙니다. 문서가 스스로 스케줄링 프레임워크가 아니고 Quartz나 Control-M 같은 스케줄러와 함께 쓰도록 만들었다고 밝힙니다. 언제 돌릴지는 스케줄러가 정하고, Spring Batch는 잡의 실행과 실패 시 재시작을 맡습니다. 실행은 명령줄이 대표적이어서 CommandLineJobOperator가 컨텍스트를 올리고 인자를 JobParameters로 바꿔 잡을 시작하며 종료 코드를 돌려줍니다. 웹 요청에서는 JobOperator를 비동기로 설정해 바로 반환하게 합니다. Spring Boot는 시작할 때 잡이 자동 실행되는데 `spring.batch.job.enabled`로 끌 수 있습니다.

(공식 문서) Introduction 페이지는 Spring Batch가 스케줄링 프레임워크가 아니며 스케줄러와 함께 쓰도록 의도됐다고 한다. Running a Job 페이지는 엔터프라이즈 스케줄러와 쓸 때 명령줄이 기본 인터페이스이고, CommandLineJobOperator가 ApplicationContext 로드, 인자의 JobParameters 변환, 잡 탐색, JobOperator로 시작을 한다고 설명한다. 종료 코드는 기본적으로 정상 완료 0, 일반 오류 1, 잡을 찾지 못하는 등 러너 오류 2로 매핑된다. 웹 컨테이너에서는 요청을 오래 붙잡지 않도록 비동기 실행이 가장 중요하고 이를 위해 JobOperator에 TaskExecutor를 설정한다고 한다(Configuring a JobOperator 페이지).
(공식 문서) Spring Boot 애플리케이션 속성 부록은 `spring.batch.job.enabled`(기본 true)가 시작 시 잡 실행 여부이고 잡이 여럿이면 `spring.batch.job.name`으로 지정한다고 한다. Boot 배치 how-to는 `--`로 시작하는 인자는 Environment 속성이 되어 잡 파라미터로 전달되지 않는다고 설명한다.
(실험하지 않았다) 문서 근거로만 썼다.
