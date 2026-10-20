---
slug: "misc-15"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "가상 스레드를 켜면 `@Async`와 스케줄러는 어떻게 되나요?"
keywords: ["풀 설정 무효", "`spring.main.keep-alive`", "동시성 제한 대체 수단", "`@ConcurrencyLimit`"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html", "https://docs.spring.io/spring-boot/3.3/reference/features/spring-application.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/resilience/annotation/ConcurrencyLimit.html", "https://docs.spring.io/spring-framework/reference/core/resilience.html", "https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes"]
concepts: [virtual-thread, thread-pool]
importance: 1
---
**모범 답변 (30~60초)**
가상 스레드를 켜면 Boot가 자동 구성하는 `@Async`용 실행기와 스케줄러가 가상 스레드 기반(`SimpleAsyncTaskExecutor`, `SimpleAsyncTaskScheduler`)으로 바뀌고, 스레드 풀 크기 같은 풀 설정은 효과가 없습니다. 그래서 풀 크기로 동시성을 제한하던 곳은 다른 방법이 필요한데, Spring 7의 `@ConcurrencyLimit`이 스레드 풀 제한이 없는 가상 스레드 환경을 위한 수단입니다. `@EnableResilientMethods`로 켜고, 비동기 작업은 `SimpleAsyncTaskExecutor`의 동시성 제한으로도 제한할 수 있습니다. 또 가상 스레드는 데몬이라 `@Scheduled`만으로 유지되던 앱은 JVM이 종료될 수 있어 `spring.main.keep-alive=true`가 권장됩니다(Boot 3.3 문서).

(공식 문서) Boot 작업 실행 문서는, 가상 스레드를 켜면(Java 21 이상, `spring.threads.virtual.enabled=true`) 자동 구성 `AsyncTaskExecutor`는 `SimpleAsyncTaskExecutor`, 스케줄러는 풀 관련 프로퍼티를 무시하는 `SimpleAsyncTaskScheduler`라고 하고, `@EnableAsync`의 비동기 실행이 이 자동 구성 실행기를 쓴다고 한다(`AsyncConfigurer` 빈을 정의하지 않은 경우). Boot 프로퍼티 목록은 스레드 풀 관련 프로퍼티가 가상 스레드에서는 효과가 없다고 하고, `spring.main.keep-alive`를 "비데몬 스레드가 더 없어도 앱을 살려 둘지"로 설명한다(기본 false). `@ConcurrencyLimit` Javadoc과 resilience 문서는 이 애노테이션이 메서드(또는 타입 수준에서 프록시로 호출되는 모든 메서드)의 동시 실행 수를 제한하고, 기본은 한도 도달 시 대기이며 `policy = REJECT`로 거절할 수도 있다고 한다. 특히 "스레드 풀 제한이 보통 없는 가상 스레드와 함께 쓸 때 유용"하다고 명시하고, 비동기 작업은 `SimpleAsyncTaskExecutor`에서 제한할 수 있으며 동기 호출은 `ConcurrencyThrottleInterceptor`로 동등한 동작을 한다고 한다. `@Retryable`과 `@ConcurrencyLimit`은 `@EnableResilientMethods`로 켜며(7.0 릴리스 노트의 resilience 항목도 같다), 7.0에서 처음 추가됐다. Boot 3.3 레퍼런스는 가상 스레드는 데몬 스레드이고 JVM은 모든 스레드가 데몬이면 종료하므로, `@Scheduled` 빈으로 앱을 살려 두던 경우 스케줄러 스레드가 가상 스레드라 JVM을 붙잡지 못하며, 모든 경우에 JVM을 유지하려면 `spring.main.keep-alive`를 true로 두라고 권한다.

(보충) `keep-alive` 안내는 Boot 3.3 문서에서 확인한 것이고 Boot 4.x 레퍼런스 페이지에서는 같은 설명을 찾지 못했다(프로퍼티 설명만 확인). 최신 버전에서 동작이 바뀌었는지는 확인하지 못했다. "풀 크기로 동시성을 제한하던 곳은 다른 수단으로 제한해야 한다"는 연결은 위 문서 내용을 이은 필자의 정리다. 실험으로는 가상 스레드를 켜면 `applicationTaskExecutor`가 가상 스레드를 쓴다는 점까지만 확인했고(Boot 4.1.1), 스케줄러·`keep-alive`·`@ConcurrencyLimit`은 실험하지 않았다.
