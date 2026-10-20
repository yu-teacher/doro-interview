---
slug: "pat-16"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "스프링 이벤트 리스너는 기본이 동기 호출인가요? 트랜잭션이나 `@Async`와 함께 쓸 때 무엇을 주의해야 하나요?"
keywords: ["기본은 동기·단일 스레드", "publishEvent가 블로킹", "발행자 트랜잭션 컨텍스트 안에서 실행", "@Async 예외가 호출자에게 전파 안 됨", "ThreadLocal 전파 안 됨"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html", "https://gameprogrammingpatterns.com/observer.html"]
concepts: [gof-patterns, tx-boundary, thread-pool]
importance: 2
links: [{to: "ioc-25", kind: RELATED}, {to: "tx-19", kind: RELATED}, {to: "tx-23", kind: RELATED}]
---
**모범 답변 (30~60초)**
네, 기본은 동기입니다. 스프링 문서에 따르면 리스너는 이벤트를 동기로 받고, 모든 리스너가 처리를 마칠 때까지 `publishEvent()`가 블로킹됩니다. 장점은 같은 스레드에서 돌기 때문에 리스너가 발행자의 트랜잭션 컨텍스트 안에서 동작할 수 있다는 점입니다. 특정 리스너를 비동기로 돌리려면 `@Async`를 함께 쓰는데, 이때 리스너가 던진 예외는 호출자에게 전파되지 않고, 반환값으로 후속 이벤트를 발행할 수 없으며, `ThreadLocal`과 로깅 컨텍스트도 기본으로는 전파되지 않습니다.

```java
@EventListener
@Async
public void processBlockedListEvent(BlockedListEvent event) {
    // BlockedListEvent is processed in a separate thread
}
```

(공식 문서) 스프링 Standard and Custom Events 절: 리스너는 기본적으로 이벤트를 동기로 받으며 `publishEvent()`는 모든 리스너가 끝날 때까지 블로킹된다. 동기·단일 스레드 방식의 장점은 트랜잭션 컨텍스트가 있으면 리스너가 발행자의 트랜잭션 컨텍스트 안에서 동작한다는 것이라고 하고, 기본이 비동기여야 한다면 `ApplicationEventMulticaster` 설정을 보라고 하며 그 경우 `ThreadLocal`과 로깅 컨텍스트는 전파되지 않는다고 한다. 비동기 리스너는 `@Async`를 재사용하며, 비동기 리스너가 던진 예외는 호출자에게 전파되지 않고, 비동기 리스너는 반환값으로 후속 이벤트를 발행할 수 없다고 한다. 위 코드는 문서의 예다.
(원저자 자료) Nystrom, "Observer" 장도 옵저버가 동기라서 느린 옵저버가 주체를 막을 수 있다고 경고한다.
(실험 확인) 스프링이 아닌 직접 만든 옵저버 구현에서, 300ms를 자는 옵저버가 등록되어 있으면 `notifyAll` 호출이 300ms 이상 걸려서야 반환했고, 옵저버는 호출자와 같은 스레드에서 실행되었다.
