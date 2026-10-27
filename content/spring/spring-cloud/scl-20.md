---
slug: "scl-20"
topic: "spring-cloud"
tier: TRICKY
difficulty: 3
title: "Gateway, Feign이나 로드 밸런서, 서비스 코드에 재시도를 각각 걸면 어떤 문제가 생기고 기본값은 어떻게 되어 있나요?"
keywords: ["계층별 재시도가 곱해짐", "게이트웨이 Retry 기본은 GET 3회", "Feign 기본 NEVER_RETRY", "로드 밸런서 재시도 기본 꺼짐", "본문 있는 메서드는 본문 캐시"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/gatewayfilter-factories/retry-factory.html", "https://docs.spring.io/spring-cloud-openfeign/reference/spring-cloud-openfeign.html", "https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/common-abstractions.html", "https://docs.spring.io/spring-framework/reference/core/resilience.html"]
concepts: [resilience, idempotency]
importance: 2
links: [{to: "scl-07", kind: PREREQ}, {to: "dst-19", kind: RELATED}, {to: "dst-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
재시도는 계층마다 독립적으로 일어나므로 겹쳐 두면 횟수가 곱해져서, 장애 난 서비스가 받는 요청이 최악에는 각 계층 횟수의 곱만큼 늘어납니다. 그래서 어느 계층에서 재시도할지 정하고 기본값을 알아 두는 것이 중요합니다. 게이트웨이 `Retry` 필터는 켜면 5xx 시리즈, GET 메서드, 3회가 기본이고 백오프는 꺼져 있습니다. 스프링 클라우드 OpenFeign은 기본 `Retryer`가 `NEVER_RETRY`라서 Feign 원래 기본과 달리 재시도하지 않습니다. 로드 밸런서 재시도도 기본으로 꺼져 있습니다. 본문이 있는 메서드를 게이트웨이에서 재시도하면 본문을 메모리에 캐시해 메모리 부담이 생깁니다.

```java
RetryTemplate t = new RetryTemplate(
    RetryPolicy.builder().maxRetries(3).delay(Duration.ZERO).build());
t.execute(() -> { n.incrementAndGet(); throw new IllegalStateException(); });
// 마지막에 RetryException, n == 4
```

(공식 문서) 게이트웨이 `Retry` 필터 문서는 파라미터로 `retries`, `statuses`, `methods`, `series`, `exceptions`, `backoff`, `jitter`, `timeout`을 들고, 켰을 때 기본이 3회, 5XX 시리즈, GET 메서드, `IOException`과 `TimeoutException`, 백오프 꺼짐이라고 쓴다. 이 필터 뒤에 오는 모든 필터가 다시 실행되므로 결과를 확인해야 하고, 본문이 있는 HTTP 메서드를 재시도하면 본문이 캐시되어 게이트웨이가 메모리에 제약을 받는다고 경고한다.
(공식 문서) OpenFeign 문서는 기본으로 `Retryer.NEVER_RETRY` 빈이 만들어져 재시도가 꺼지며, 이는 `IOException`과 `ErrorDecoder`가 던진 `RetryableException`을 자동 재시도하는 Feign 원래 기본과 다르다고 쓴다. Commons 문서는 로드 밸런서 `RestTemplate` 재시도가 기본으로 비활성이라고 하며, `spring.cloud.loadbalancer.retry.maxRetriesOnSameServiceInstance`와 `maxRetriesOnNextServiceInstance`로 같은 인스턴스와 다음 인스턴스에 대한 재시도 횟수를 정한다고 설명한다.
(실험 확인) 스프링 프레임워크 7.0.10의 `RetryTemplate`에 `maxRetries(3)`인 정책을 주고 항상 실패하는 작업을 실행하자 작업은 4번 호출됐고 마지막에 `RetryException`이 던져졌다. 공식 문서의 `@Retryable` 설명(최초 시도 1회에 `maxRetries`만큼 추가)과 맞는다. 게이트웨이, Feign, 로드 밸런서 재시도를 실제로 중첩해 보지는 않았다.
(보충) 계층 재시도가 곱해진다는 설명은 각 계층이 독립적으로 재시도한다는 전제에서 나오는 산술이다. 예를 들어 두 계층이 각각 최초 1회에 재시도 3회를 하면 최악 16회가 된다. 이를 직접 측정하지는 않았다.
