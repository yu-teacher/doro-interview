---
slug: "dst-14"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "Bulkhead 패턴은 무엇이고 Circuit Breaker와 무엇이 다른가요?"
keywords: ["자원 풀 격리", "세마포어·스레드 풀 벌크헤드", "연쇄 장애 방지", "동시 호출 수 제한", "Circuit Breaker는 동시성을 제한하지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead", "https://resilience4j.readme.io/docs/bulkhead", "https://resilience4j.readme.io/docs/circuitbreaker"]
concepts: [resilience, thread-pool]
importance: 1
links: [{to: "dst-13", kind: PREREQ}, {to: "jt-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
Bulkhead는 선박의 격벽처럼 자원을 칸으로 나눠, 한 의존 대상의 장애가 전체로 번지지 않게 하는 패턴입니다. 호출하는 쪽이 모든 외부 호출을 하나의 스레드 풀이나 연결 풀로 처리하면 느린 서비스 하나가 풀을 다 차지해 다른 서비스 호출까지 막힙니다. 서비스별로 풀이나 동시 호출 수를 따로 두면 느린 서비스 호출만 거절되고 나머지는 계속 동작합니다. Resilience4j는 세마포어 기반과 고정 스레드 풀 기반 두 가지 벌크헤드를 제공합니다. Resilience4j 문서에 따르면 Circuit Breaker는 실패 비율을 보고 차단할 뿐 동시 실행 수를 제한하지 않아서, 동시성 제한은 Bulkhead가 맡고 둘을 함께 쓸 수 있습니다. 칸을 나누면 자원 효율이 떨어지는 대가가 있습니다.

```java
import java.util.concurrent.*;

public class Bulkhead {
    static final Semaphore slowPermits = new Semaphore(2);   // 느린 의존 서비스용 칸막이
    static final Semaphore fastPermits = new Semaphore(2);

    static String call(Semaphore bulkhead, long workMs) throws Exception {
        if (!bulkhead.tryAcquire()) return "거절(칸막이 가득)";
        try { Thread.sleep(workMs); return "처리"; } finally { bulkhead.release(); }
    }

    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(8);
        for (int i = 0; i < 2; i++) pool.submit(() -> call(slowPermits, 1000));  // 느린 호출이 칸막이를 점유
        Thread.sleep(100);
        System.out.println("느린 서비스 3번째 호출: " + call(slowPermits, 1000));
        System.out.println("빠른 서비스 호출:       " + call(fastPermits, 10));   // 영향 없음
        pool.shutdownNow();
    }
}
```

(공식 문서) Azure Bulkhead 문서는 애플리케이션 요소를 풀로 격리해 한 요소가 실패해도 나머지가 동작하게 하는 패턴이며 선박 격벽에서 이름을 땄다고 설명한다. 응답 없는 서비스로 간 요청이 연결 풀 같은 자원을 오래 붙잡으면 소비자가 다른 서비스에도 요청하지 못하게 되므로, 서비스마다 연결 풀을 따로 두는 예를 든다. 고려사항으로 프로세스·스레드 풀·세마포어로 분할할 수 있고(resilience4j와 Polly 언급), 재시도·Circuit Breaker·스로틀링과 함께 쓸 수 있으며, 자원 효율이 떨어지는 단점이 있다고 한다. Resilience4j Bulkhead 문서는 `SemaphoreBulkhead`와 고정 스레드 풀·유한 큐 기반 `FixedThreadPoolBulkhead` 두 구현을 제공한다고 하고, 기본 `maxConcurrentCalls`는 25, 포화된 벌크헤드에서 기다리는 `maxWaitDuration` 기본값은 0이라고 한다. Resilience4j CircuitBreaker 문서는 슬라이딩 윈도우 크기가 동시 실행 허용 수가 아니며 동시 스레드를 제한하려면 Bulkhead를 쓰고 둘을 결합할 수 있다고 명시한다.
(실험 확인) 위 코드는 허용 2건짜리 느린 서비스용 세마포어를 느린 호출 2건이 점유한 상태에서 3번째 호출이 즉시 거절되었고, 별도 세마포어를 쓰는 빠른 서비스 호출은 정상 처리되었다(JDK 25 Corretto 25.0.3). Resilience4j가 아닌 `Semaphore`로 직접 만든 모의이다.
