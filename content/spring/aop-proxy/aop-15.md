---
slug: "aop-15"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "어드바이스에서 `JoinPoint`로 무엇을 알 수 있나요? 인자나 반환값을 바꿀 수 있나요?"
keywords: ["JoinPoint", "ProceedingJoinPoint", "proceed()", "getThis(프록시) vs getTarget(원본)", "Around 반환 타입 Object"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html"]
---
**모범 답변 (30~60초)**
어드바이스 메서드는 첫 파라미터로 `JoinPoint`를 받으면 인자(`getArgs`), 프록시(`getThis`), 대상 객체(`getTarget`), 메서드 시그니처(`getSignature`)를 알 수 있습니다. Around만 `ProceedingJoinPoint`를 받아 `proceed()`를 호출하는데, 0번, 1번, 여러 번 호출할 수 있고 `proceed(Object[])`로 인자를 바꿔서 넘길 수도 있습니다. 반환값은 Around가 돌려주는 값이 호출자가 보는 값이라서 캐시값이나 다른 값을 반환해 바꿀 수 있고, After Returning에서는 완전히 다른 참조를 반환할 수 없습니다. Around의 반환 타입이 void이면 호출자에게 항상 null이 돌아가므로 `Object`로 선언하는 것이 좋습니다.

(공식 문서, Declaring Advice) 어떤 advice 메서드든 첫 파라미터로 `JoinPoint`를 선언할 수 있고(around는 하위 타입 `ProceedingJoinPoint` 필수) `getArgs()`, `getThis()`(프록시), `getTarget()`(대상), `getSignature()`를 제공한다. `proceed()`는 한 번, 여러 번, 또는 전혀 호출하지 않아도 되고, around의 반환값이 호출자가 보는 반환값이다. `proceed(Object[])`는 배열 값을 대상 메서드의 인자로 쓴다. after returning advice에서는 완전히 다른 참조를 반환할 수 없다.
(실험 확인) Before advice에서 `getThis()`는 컨텍스트에서 꺼낸 빈(프록시)과 같은 객체이고 `getTarget()`은 원본 클래스의 인스턴스이며, 시그니처와 인자도 읽을 수 있다.
