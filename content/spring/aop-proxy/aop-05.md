---
slug: "aop-05"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "Spring AOP는 어떻게 동작하나요? (프록시 기반이라는 것의 의미)"
keywords: ["런타임 프록시", "Target", "Advice 체인", "프록시를 거친 호출만 적용", "컴파일러 불필요"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/introduction-spring-defn.html", "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html", "https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/aspectj-support.html"]
concepts: [proxy, aop]
importance: 3
links: [{to: "aop-06", kind: FOLLOWUP}, {to: "aop-07", kind: FOLLOWUP}, {to: "aop-08", kind: FOLLOWUP}, {to: "aop-10", kind: FOLLOWUP}, {to: "pat-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
Spring AOP는 런타임 프록시 기반입니다. 어떤 빈이 Aspect에 의해 어드바이스된다고 판단되면 Spring이 그 빈에 대한 프록시를 자동으로 만들고, 호출자는 프록시를 통해 메서드를 호출합니다. 프록시가 해당 메서드에 관련된 Advice 체인을 실행한 다음 실제 대상 객체(target)를 호출합니다. 그래서 대상 안에서 일어나는 this 호출처럼 프록시를 거치지 않는 호출에는 Advice가 적용되지 않습니다. 순수 자바로 구현되어 별도 컴파일 과정이나 클래스로더 제어가 필요 없다는 점이 장점입니다.

(공식 문서) Spring AOP는 순수 자바로 구현되어 특별한 컴파일 과정이 필요 없고 클래스로더 계층을 제어하지 않는다(Capabilities and Goals). 어드바이스된 빈에는 프록시를 자동 생성해 메서드 호출을 가로챈다(Enabling @AspectJ Support). 프록시는 관련된 모든 인터셉터에 위임하며, 대상에 도달한 뒤 대상이 자기 자신에게 하는 호출은 프록시가 아니라 `this`로 가므로 advice가 실행되지 않는다(Understanding AOP Proxies).
(실험 확인) `@Aspect` 빈과 `@EnableAspectJAutoProxy`가 있는 컨텍스트에서 대상 빈을 꺼내면 원본이 아니라 AOP 프록시(`AopUtils.isAopProxy`가 true)다. `@EnableAspectJAutoProxy`가 없으면 `@Aspect` 빈이 있어도 프록시가 생기지 않고 advice도 실행되지 않는다.
