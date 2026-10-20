---
slug: "ioc-25"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@EventListener는 기본적으로 동기인가요? @Async를 붙이면 무엇이 달라지나요?"
keywords: ["동기 실행", "발행자의 트랜잭션", "@Async", "AsyncUncaughtExceptionHandler", "ThreadLocal"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html"]
---
**모범 답변 (30~60초)**
기본은 동기 실행입니다. `publishEvent()`는 모든 리스너가 끝날 때까지 블록되고, 리스너는 발행자와 같은 스레드에서 돌며, 트랜잭션 컨텍스트가 있으면 발행자의 트랜잭션 안에서 동작합니다. 문서는 이것을 동기 모델의 장점으로 꼽습니다. 리스너에 `@Async`를 붙이면 별도 스레드에서 처리되지만 대가가 있습니다. 예외가 호출자에게 전파되지 않아서 AsyncUncaughtExceptionHandler로 따로 처리해야 하고, 리스너 반환값으로 후속 이벤트를 발행하는 기능은 쓸 수 없으며, ThreadLocal과 로깅 컨텍스트도 기본적으로 넘어가지 않습니다. 그래서 결과가 필요하거나 같은 트랜잭션에서 처리해야 하면 동기로 두는 게 맞습니다.

```java
@EventListener
@Async
public void onBlocked(BlockedListEvent event) { ... }   // 별도 스레드, 예외는 호출자에게 안 간다
```

(공식 문서) context-introduction 페이지의 Standard and Custom Events 절에 근거한다. 이벤트는 같은 애플리케이션 컨텍스트 안의 빈끼리 소통하는 용도이고, 시스템 간 통합은 Spring Integration을 안내한다. 커스텀 `ApplicationEventMulticaster`에 task executor를 주어 전체를 비동기로 바꿀 수도 있다.
