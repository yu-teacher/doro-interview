---
slug: "aop-15"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "어드바이스에서 `JoinPoint`로 무엇을 알 수 있나요? 인자나 반환값을 바꿀 수 있나요?"
keywords: ["JoinPoint", "ProceedingJoinPoint", "proceed()", "getThis(프록시) vs getTarget(원본)", "Around 반환 타입 Object"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
어드바이스 메서드는 첫 파라미터로 `JoinPoint`를 받으면 인자(`getArgs`), 프록시(`getThis`), 대상 객체(`getTarget`), 메서드 시그니처(`getSignature`)를 알 수 있습니다. Around만 `ProceedingJoinPoint`를 받아 `proceed()`를 호출하는데, 0번, 1번, 여러 번 호출할 수 있고 `proceed(Object[])`로 인자를 바꿔서 넘길 수도 있습니다. 반환값은 Around에서 `Object`를 반환하는 형태로 바꿀 수 있고, After Returning에서는 완전히 다른 참조를 반환할 수 없습니다. Around의 반환 타입이 void이면 호출자에게 null이 돌아갑니다.
