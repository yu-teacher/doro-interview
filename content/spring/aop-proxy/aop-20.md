---
slug: "aop-20"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "Aspect 클래스 자체도 빈이어야 하나요? AOP를 쓰려면 의존성은?"
keywords: ["@Aspect + @Component", "@EnableAspectJAutoProxy", "aspectjweaver 1.9+"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/at-aspectj.html", "https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/aspectj-support.html", "https://docs.spring.io/spring-boot/reference/features/aop.html", "https://docs.spring.io/spring-boot/reference/using/build-systems.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/EnableAspectJAutoProxy.html"]
---
**모범 답변 (30~60초)**
Spring AOP에서 Aspect는 Spring 빈으로 등록되어야 동작합니다. XML이나 `@Bean` 메서드로 등록할 수도 있고, 클래스패스 스캔으로 자동 감지하려면 `@Aspect`만으로는 부족해서 `@Component` 같은 애노테이션을 따로 붙여야 합니다. 그리고 `@EnableAspectJAutoProxy`로 @AspectJ 지원을 켜고, `aspectjweaver`(1.9 이상)가 클래스패스에 있어야 합니다. Spring Boot는 AspectJ가 클래스패스에 있으면 자동 설정이 AspectJ auto proxy를 켜 주므로 `@EnableAspectJAutoProxy`가 필요 없고, 스타터로는 `spring-boot-starter-aspectj`를 씁니다.

(공식 문서, Declaring an Aspect) `@Aspect`가 붙은 클래스의 빈은 자동 감지되어 Spring AOP 설정에 쓰인다. aspect 클래스는 XML, `@Bean` 메서드, 클래스패스 스캔으로 등록할 수 있지만 클래스패스 자동 감지에는 `@Aspect`로는 부족하고 별도 `@Component`(또는 조건에 맞는 커스텀 스테레오타입)가 필요하다. Spring AOP에서 aspect 자체는 다른 aspect의 advice 대상이 될 수 없다.
(공식 문서, Enabling @AspectJ Support) `@AspectJ` 지원은 자바 설정(`@EnableAspectJAutoProxy`) 또는 XML로 켜고, `org.aspectj:aspectjweaver`(1.9 이상)가 클래스패스에 있어야 한다.
(공식 문서, Spring Boot AOP 페이지 4.1 / Build Systems 스타터 목록) Boot 자동 설정은 AspectJ가 클래스패스에 있으면 AspectJ auto proxy를 켜서 `@EnableAspectJAutoProxy`가 필요 없다. 스타터 목록에는 `spring-boot-starter-aspectj`("AspectJ로 AOP를 쓰기 위한 스타터")가 있고 `spring-boot-starter-aop`는 목록에 없다.
