---
slug: "mvc-17"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "가상 스레드(`spring.threads.virtual.enabled`)를 켜면 무엇이 달라지나요?"
keywords: ["가상 스레드", "Java 21", "spring.threads.virtual.enabled", "SimpleAsyncTaskExecutor", "블로킹 코드"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"Java 21 이상에서 `spring.threads.virtual.enabled=true`를 주면 Boot가 자동 구성하는 작업 실행·스케줄링 인프라가 가상 스레드를 쓰게 됩니다. 문서상 `@EnableAsync`, Spring MVC의 비동기 요청 처리 등이 그 대상으로 나옵니다. 가상 스레드는 블로킹 호출을 해도 OS 스레드를 오래 붙잡지 않으므로, 기존의 동기 블로킹 MVC 코드를 리액티브로 바꾸지 않고도 높은 동시성을 얻으려는 선택지입니다. 다만 CPU 바운드 작업이 빨라지는 것은 아니고, 코드의 스레드 안전성 문제나 DB 커넥션 풀 같은 다른 병목은 그대로입니다. 웹 서버(Tomcat)의 요청 처리 스레드에 어떻게 반영되는지는 제가 이번에 문서로 확인하지 못해 따로 확인이 필요합니다."

- (공식 문서) Java 21+ 및 프로퍼티 설정 필요, 자동 구성 `AsyncTaskExecutor`는 가상 스레드 기반 `SimpleAsyncTaskExecutor`, 스케줄러는 `SimpleAsyncTaskScheduler`로 바뀜. 문서 해당 페이지는 Tomcat/Jetty 동작을 다루지 않습니다.
- (보충) "블로킹해도 OS 스레드를 오래 점유하지 않는다", "CPU 바운드에는 도움이 안 된다", "커넥션 풀이 병목으로 남는다"는 가상 스레드 일반 지식입니다.

```yaml
spring:
  threads:
    virtual:
      enabled: true
```
