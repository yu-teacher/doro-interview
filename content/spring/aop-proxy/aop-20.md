---
slug: "aop-20"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "Aspect 클래스 자체도 빈이어야 하나요? AOP를 쓰려면 의존성은?"
keywords: ["@Aspect + @Component", "@EnableAspectJAutoProxy", "aspectjweaver 1.9+"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
Spring AOP에서 Aspect는 빈으로 등록되어야 동작하므로 `@Aspect`와 함께 `@Component` 등으로 등록합니다(보충: 공식 페이지에서는 다음 절 "Declaring an Aspect"에 있어 이번엔 읽지 않았다). 그리고 @AspectJ 지원을 켜야 하고, `aspectjweaver`(1.9 이상)가 클래스패스에 있어야 합니다. Boot에서는 보통 AOP 스타터를 추가하면 됩니다(보충).
