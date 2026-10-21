---
slug: "misc-09"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "스프링에서 가상 스레드는 어떻게 쓰나요?"
keywords: ["JDK 21", "`spring.threads.virtual.enabled`", "VirtualThreadTaskExecutor", "pinning", "커넥션 풀이 새 병목"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html", "https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-6.1-Release-Notes", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/task/VirtualThreadTaskExecutor.html", "https://docs.spring.io/spring-boot/reference/features/spring-application.html"]
concepts: [virtual-thread, thread-pool]
importance: 2
links: [{to: "misc-15", kind: FOLLOWUP}, {to: "jt-15", kind: RELATED}, {to: "mvc-17", kind: RELATED}, {to: "jt-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
가상 스레드는 JDK 21 이상에서 쓰는 경량 스레드로, 블로킹 I/O가 많은 서버에서 "요청당 스레드" 모델을 유지하면서 동시 처리량을 높여 줍니다. 스프링은 6.1부터 JDK 21과 가상 스레드 호환을 지원했고 `VirtualThreadTaskExecutor` 같은 설정 옵션을 추가했습니다. Boot에서는 Java 21 이상에서 `spring.threads.virtual.enabled=true` 한 줄로 켭니다. 켜면 톰캣 요청 처리 스레드와 `applicationTaskExecutor`가 가상 스레드를 쓰고, 스레드 풀 크기 설정은 효과가 없어집니다. 다만 `synchronized` 등으로 캐리어 스레드가 고정되는 pinning이 있으면 처리량이 줄 수 있고, 가상 스레드가 많아져도 Hikari 풀은 그대로 10개라서 병목이 DB 커넥션으로 옮겨 갈 수 있습니다.

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

(공식 문서) Boot의 작업 실행·스케줄링 문서는 Executor 빈이 없을 때 자동 구성되는 `AsyncTaskExecutor`가, 가상 스레드를 켠 경우(Java 21 이상, `spring.threads.virtual.enabled=true`) 가상 스레드를 쓰는 `SimpleAsyncTaskExecutor`가 되고 그렇지 않으면 `ThreadPoolTaskExecutor`라고 한다. 스케줄러도 가상 스레드를 켜면 `SimpleAsyncTaskScheduler`가 되어 풀 관련 프로퍼티를 무시한다. Boot 프로퍼티 목록은 `server.tomcat.threads.max`와 `spring.task.execution.pool.*`에 대해 "가상 스레드를 켜면 효과가 없다"고 적고, `spring.threads.virtual.enabled`의 기본값은 false다. Framework 6.1 릴리스 노트는 가상 스레드와 JDK 21에 대한 일반적 호환, 전용 `VirtualThreadTaskExecutor`와 `SimpleAsyncTaskExecutor`의 가상 스레드 모드를 소개한다(6.0 노트는 JDK 19 프리뷰와의 초기 호환을 언급한다). pinning 경고는 Boot 4.1 레퍼런스(Spring Application 페이지)에 있다. 가상 스레드를 켜기 전에 JDK 문서를 읽으라고 하고, 일부 경우 "고정된 가상 스레드(pinned virtual threads)" 때문에 처리량이 낮아질 수 있다고 하며, 스레드 풀 설정이 효과가 없는 이유는 가상 스레드가 JVM 전체의 플랫폼 스레드 풀에서 스케줄되기 때문이라고 설명한다.

(공식 문서) Boot 4.1 레퍼런스의 Spring Application 페이지(Virtual threads 절)는 가상 스레드에 Java 21 이상이 필요하고 최상의 경험을 위해서는 Java 24 이상을 강하게 권장하며, 일부 애플리케이션은 "Pinned Virtual Threads" 때문에 처리량이 낮아질 수 있고 JDK Flight Recorder나 `jcmd`로 이를 찾을 수 있다고 한다. 가상 스레드를 켜면 스레드 풀 설정 프로퍼티는 효과가 없다고도 한다.
(보충) 커넥션 풀 병목에 대한 언급은 필자의 판단이며, 아래 실험에서 풀 크기가 그대로 10이라는 사실만 확인했다. 가상 스레드가 JDK 21에서 정식 기능이 되었다는 점은 JDK 쪽 일반 지식이다.

(실험 확인) Boot 4.1.1, Java 21 환경에서 `spring.threads.virtual.enabled=true`를 켜면 톰캣 요청 처리 스레드가 가상 스레드(이름 `tomcat-handler-N`)였고, `applicationTaskExecutor`는 `SimpleAsyncTaskExecutor`로 가상 스레드에서 작업을 실행했다. 켜지 않은 기본 설정에서는 요청이 `http-nio-auto-N-exec-M` 플랫폼 스레드에서, `applicationTaskExecutor`는 `ThreadPoolTaskExecutor`의 플랫폼 스레드에서 실행됐다. 가상 스레드를 켜도 앱의 Hikari 풀 최대 크기는 10 그대로였다. pinning은 실험하지 않았다.
