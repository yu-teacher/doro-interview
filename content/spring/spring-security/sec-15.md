---
slug: "sec-15"
topic: "spring-security"
tier: TRICKY
difficulty: 3
title: "새 스레드에서 실행한 작업에서는 SecurityContext가 왜 사라지고, 어떻게 전파하나요?"
keywords: ["ThreadLocal", "DelegatingSecurityContextRunnable", "DelegatingSecurityContextExecutor", "MODE_INHERITABLETHREADLOCAL", "새 스레드"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-security/reference/servlet/integrations/concurrency.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html"]
concepts: [thread-binding, thread-pool]
importance: 1
links: [{to: "tx-23", kind: RELATED}, {to: "jt-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
기본 저장 전략이 ThreadLocal이라 새 스레드에서 일하면 SecurityContext를 잃습니다. 해결책은 DelegatingSecurityContextRunnable로 작업을 감싸는 것으로, 실행 전에 지정한 컨텍스트를 설정하고 끝나면 finally에서 SecurityContextHolder를 비웁니다. 여러 작업에는 Executor를 DelegatingSecurityContextExecutor로 감싸는데, 컨텍스트를 생략하면 작업을 제출하는 시점의 호출자 컨텍스트를 캡처하고, 컨텍스트를 지정하면 모든 작업이 같은 사용자로 실행되어 권한이 높은 백그라운드 작업에 쓰라고 합니다. 다른 방법으로 MODE_INHERITABLETHREADLOCAL 전략이 있어 자식 스레드가 같은 신원을 공유하며, 전략은 시스템 속성이나 SecurityContextHolder의 정적 메서드로 바꿉니다.

```java
Executor executor = new DelegatingSecurityContextExecutor(delegateExecutor);
```

(공식 문서) 동시성 페이지와 인증 아키텍처 페이지에 근거한다. 동시성 페이지는 이 인프라가 AsyncContext.start(Runnable)와 Spring MVC 비동기 통합의 바탕이라고만 짧게 언급하며, @Async의 전파 방식은 설명하지 않아 이 답변에서 다루지 않았다.
