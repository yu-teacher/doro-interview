---
slug: "aop-05"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "Spring AOP는 어떻게 동작하나요? (프록시 기반이라는 것의 의미)"
keywords: ["런타임 프록시", "Target", "Advice 체인", "프록시를 거친 호출만 적용", "컴파일러 불필요"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
Spring AOP는 런타임 프록시 기반입니다. Aspect가 적용되는 빈에 대해 컨테이너가 프록시 객체를 만들어 원래 빈 대신 등록하고, 호출자는 프록시를 통해 메서드를 호출합니다. 프록시가 Advice 체인을 실행한 다음 실제 대상 객체(target)를 호출합니다. 그래서 Spring AOP는 프록시를 거치는 호출에만 적용됩니다. 별도 컴파일러나 클래스로더 조작이 필요 없는 순수 자바라는 점이 장점입니다.
