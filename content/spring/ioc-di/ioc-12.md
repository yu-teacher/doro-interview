---
slug: "ioc-12"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "@Configuration은 왜 CGLIB 프록시로 감싸지나요? proxyBeanMethods는 무엇인가요?"
keywords: ["CGLIB 서브클래스", "@Bean 호출 가로채기", "lite 모드", "proxyBeanMethods=false", "파라미터 주입", "final/private 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/java/configuration-annotation.html", "https://docs.spring.io/spring-framework/reference/core/beans/java/basic-concepts.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Configuration.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Bean.html"]
concepts: [ioc-di, proxy]
importance: 1
links: [{to: "ioc-11", kind: PREREQ}, {to: "aop-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
@Configuration 클래스에서 한 @Bean 메서드가 다른 @Bean 메서드를 호출하면, 자바 관점에서는 매번 새로 생성하는 것처럼 보입니다. 이를 막기 위해 스프링은 시작 시 설정 클래스를 CGLIB로 상속한 서브클래스를 만들어, @Bean 메서드 호출을 가로채서 컨테이너에 이미 캐시된 빈이 있으면 그것을 반환합니다. 그래서 싱글톤이 보장됩니다. @Configuration(proxyBeanMethods = false)로 끄면 CGLIB 강화가 없어 lite 모드로 동작하고, 메서드 간 직접 호출은 가로채이지 않아 새 인스턴스를 만듭니다. 이때는 의존성을 메서드 파라미터로 받아야 합니다. 대신 런타임 오버헤드와 부담이 줄어듭니다. 강화를 위해 설정 클래스와 @Bean 메서드는 final이나 private이면 안 됩니다.

- (공식 문서) 모든 `@Configuration` 클래스는 시작 시 CGLIB로 서브클래싱되고, 자식 메서드는 부모 메서드를 호출해 새 인스턴스를 만들기 전에 컨테이너에 캐시된 (스코프) 빈이 있는지 먼저 확인한다(싱글톤 기준이며 스코프에 따라 동작이 다를 수 있다). `proxyBeanMethods=false`이거나 `@Configuration`이 없으면 lite 모드이며 inter-bean 호출은 가로채이지 않아 호출마다 새 인스턴스가 만들어지므로 파라미터로 협력 객체를 받아야 한다. lite 모드는 CGLIB 서브클래싱이 없어 오버헤드와 풋프린트가 줄어든다. 설정 클래스는 final이면 안 되고(`proxyBeanMethods=false`는 예외), Javadoc은 이 모드에서 `@Configuration` 클래스와 그 팩토리 메서드가 final이나 private이면 안 된다고 한다. CGLIB 클래스는 `spring-core` JAR에 repackage되어 있다.
- (실험 확인) `proxyBeanMethods=true`이면 `@Bean` 메서드 간 직접 호출이 컨테이너 싱글톤과 같은 인스턴스를 돌려주고 설정 클래스는 `$$SpringCGLIB$$` 서브클래스로 만들어진다. `false`이면 직접 호출이 새 인스턴스를 만들고 설정 클래스는 원래 클래스 그대로다.

```java
@Configuration(proxyBeanMethods = false)
class AppConfig {
    @Bean BeanTwo beanTwo() { return new BeanTwo(); }
    @Bean BeanOne beanOne(BeanTwo beanTwo) {     // 호출 대신 파라미터로 받음
        return new BeanOne(beanTwo);
    }
}
```
