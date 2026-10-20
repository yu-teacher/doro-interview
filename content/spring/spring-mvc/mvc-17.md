---
slug: "mvc-17"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "가상 스레드(`spring.threads.virtual.enabled`)를 켜면 무엇이 달라지나요?"
keywords: ["가상 스레드", "Java 21", "spring.threads.virtual.enabled", "SimpleAsyncTaskExecutor", "블로킹 코드"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
concepts: [virtual-thread, thread-pool]
importance: 1
links: [{to: "jt-15", kind: RELATED}, {to: "misc-09", kind: RELATED}, {to: "jt-20", kind: RELATED}]
---
**모범 답변 (30~60초)**
Java 21 이상에서 `spring.threads.virtual.enabled=true`를 주면 Boot가 자동 구성하는 `AsyncTaskExecutor`가 가상 스레드를 쓰는 `SimpleAsyncTaskExecutor`가 되고, 스케줄러도 `SimpleAsyncTaskScheduler`가 됩니다. 이 실행기는 `@EnableAsync`와 Spring MVC의 비동기 요청 처리 등에 쓰입니다. Boot 프로퍼티 설명에 따르면 `server.tomcat.threads.max`는 가상 스레드를 켜면 효과가 없습니다. 가상 스레드는 블로킹 호출에서 플랫폼 스레드를 오래 붙잡지 않아서, 동기 블로킹 코드를 리액티브로 바꾸지 않고 동시성을 높이려는 선택지입니다. 다만 CPU 바운드 작업이 빨라지는 것은 아니고, DB 커넥션 풀 같은 다른 병목이나 코드의 스레드 안전성 문제는 그대로입니다.

- (공식 문서, Boot 작업 실행) Executor 빈이 없으면 Boot가 `AsyncTaskExecutor`를 자동 구성하며, 가상 스레드를 켜면(Java 21+ 및 `spring.threads.virtual.enabled=true`) 가상 스레드를 쓰는 `SimpleAsyncTaskExecutor`, 아니면 `ThreadPoolTaskExecutor`가 된다. 이 실행기는 `@EnableAsync`, Spring MVC의 비동기 요청 처리, WebFlux의 블로킹 실행 지원 등에 쓰인다. 스케줄러는 가상 스레드를 켜면 풀 관련 속성을 무시하는 `SimpleAsyncTaskScheduler`, 아니면 `ThreadPoolTaskScheduler`가 되고, 빌더 빈들도 같은 조건에서 가상 스레드를 쓰도록 자동 구성된다.
- (공식 문서, Boot 프로퍼티) `spring.threads.virtual.enabled`는 "가상 스레드를 사용할지 여부"이고 기본값은 false다. `server.tomcat.threads.max`는 가상 스레드를 켜면 효과가 없다고 설명한다.
- (보충) "블로킹해도 플랫폼 스레드를 오래 점유하지 않는다", "CPU 바운드에는 도움이 안 된다", "커넥션 풀이 병목으로 남는다"는 가상 스레드 일반 지식이다. Tomcat 요청 처리 스레드가 가상 스레드로 바뀌는지를 직접 서술한 문장은 읽은 페이지에 없고, 위 프로퍼티 설명이 간접 단서일 뿐이다.

```yaml
spring:
  threads:
    virtual:
      enabled: true
```
