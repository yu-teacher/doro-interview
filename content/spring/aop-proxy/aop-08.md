---
slug: "aop-08"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "Spring은 프록시를 언제, 어떻게 만드나요? (BeanPostProcessor / auto-proxy)"
keywords: ["auto-proxy creator", "BeanPostProcessor", "초기화 이후 프록시로 교체", "Advisor 매칭", "주입되는 것은 프록시"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/aspectj-support.html", "https://docs.spring.io/spring-framework/reference/core/aop-api/autoproxy.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/framework/autoproxy/AbstractAutoProxyCreator.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/aspectj/annotation/AnnotationAwareAspectJAutoProxyCreator.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/EnableAspectJAutoProxy.html", "https://docs.spring.io/spring-boot/reference/features/aop.html"]
---
**모범 답변 (30~60초)**
`@EnableAspectJAutoProxy`를 켜면(Boot는 AspectJ가 클래스패스에 있을 때 자동 설정) auto-proxy creator가 컨테이너에 등록되어 동작합니다. auto-proxy creator는 BeanPostProcessor라서 빈 생성 과정에 끼어들고, 빈이 초기화된 뒤(`postProcessAfterInitialization`) 그 빈에 적용될 Advisor가 있다고 판단되면 원본 대신 프록시를 만들어 반환합니다. 적용 대상이 없으면 원본을 그대로 돌려줍니다. 그래서 다른 빈이 주입받는 것은 원본이 아니라 프록시입니다. 문서도 어떤 빈이 하나 이상의 Aspect에 의해 어드바이스된다고 판단되면 자동으로 프록시를 만들어 메서드 호출을 가로챈다고 설명합니다.

(공식 문서, Enabling @AspectJ Support) 어드바이스된다고 판단된 빈에 프록시를 자동 생성한다. `aspectjweaver`(1.9 이상)가 클래스패스에 필요하다. Javadoc: `@EnableAspectJAutoProxy`는 `@Aspect` 컴포넌트 처리를 켜고 `aspectjweaver`가 필요하며, 적용 범위는 선언한 로컬 애플리케이션 컨텍스트다. Boot 문서: AspectJ가 클래스패스에 있으면 자동 설정이 AspectJ auto proxy를 켜므로 `@EnableAspectJAutoProxy`가 필요 없다.
(공식 문서, auto-proxy 페이지 / Javadoc) auto-proxy는 "bean post processor" 인프라 위에 만들어졌다. `AbstractAutoProxyCreator`는 적격한 각 빈을 AOP 프록시로 감싸는 `BeanPostProcessor` 구현이고, `postProcessAfterInitialization`은 하위 클래스가 프록시 대상으로 식별한 빈에 프록시를 만들며 반환값은 원본 또는 감싼 빈이다. `AnnotationAwareAspectJAutoProxyCreator`는 그 하위 클래스로 `@AspectJ` aspect와 Spring Advisor를 처리한다. 프로그래밍 방식으로는 `ProxyFactory`로 Spring IoC 없이도 프록시를 만들 수 있다(공식 문서, ProxyFactory 페이지).
(보충) `@EnableAspectJAutoProxy`가 구체적으로 `AnnotationAwareAspectJAutoProxyCreator`를 등록한다는 서술은 읽은 문서 페이지에 없으며 일반 지식에 의한 설명이다.
(실험 확인) `@Aspect` 빈과 `@EnableAspectJAutoProxy`가 있으면 컨텍스트에서 꺼낸 대상 빈은 프록시(인터페이스가 없으므로 CGLIB)이고 `AopUtils.getTargetClass`는 원본 클래스를 돌려준다. `@EnableAspectJAutoProxy`가 없으면 프록시가 생기지 않는다.
