---
slug: "aop-03"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "Advice 종류를 설명해 주세요."
keywords: ["@Before", "@AfterReturning", "@AfterThrowing", "@After(finally)", "@Around", "가장 약한 어드바이스 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html"]
---
**모범 답변 (30~60초)**
다섯 가지입니다. Before는 메서드 실행 전에 돌고 예외를 던지지 않는 한 실행 흐름을 막지 못합니다. After Returning은 정상 반환 후, After Throwing은 예외로 빠져나갈 때, After(finally)는 정상이든 예외든 항상 실행됩니다. Around는 메서드 전체를 감싸서 실행 여부, 인자, 반환값까지 정할 수 있는 가장 강력한 어드바이스입니다. 문서는 요구사항을 충족하는 가장 약한 형태를 쓰라고 권합니다. 예를 들어 반환값으로 캐시를 갱신만 하면 되는 경우 Around보다 After Returning이 단순하고 실수가 적습니다.

```java
@Around("execution(* com.example..service.*.*(..))")
public Object profile(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.nanoTime();
    try {
        return pjp.proceed();          // 호출하지 않으면 대상 메서드는 실행되지 않는다
    } finally {
        log.info("{} took {}ns", pjp.getSignature(), System.nanoTime() - start);
    }
}
```

(공식 문서, AOP Concepts / Declaring Advice) 다섯 종류의 정의, "가장 약한 advice 종류를 쓰라"는 권고와 캐시 갱신 예, After(finally)는 try-catch의 finally와 같은 의미라는 설명, Around에서 `proceed()`를 호출해야 대상이 실행된다는 설명이 있다.
