---
slug: "aop-06"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "JDK 동적 프록시와 CGLIB 프록시의 차이는? Spring Boot의 기본은?"
keywords: ["JDK 동적 프록시(인터페이스)", "CGLIB(상속)", "proxyTargetClass", "Boot 기본 CGLIB", "`@Proxyable`(7.0+)"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-proxies.html", "https://docs.spring.io/spring-boot/reference/features/aop.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Proxyable.html"]
concepts: [proxy]
importance: 3
links: [{to: "aop-11", kind: FOLLOWUP}, {to: "aop-12", kind: FOLLOWUP}, {to: "aop-16", kind: FOLLOWUP}, {to: "aop-19", kind: FOLLOWUP}, {to: "pat-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
JDK 동적 프록시는 JDK에 내장된 기능으로 인터페이스를 구현한 프록시를 만들고, CGLIB은 대상 클래스를 상속한 서브클래스를 런타임에 생성합니다. Spring Framework의 기본 규칙은 대상이 인터페이스를 하나라도 구현하면 JDK 프록시, 구현하는 인터페이스가 없으면 CGLIB입니다. `proxyTargetClass=true`로 CGLIB을 강제할 수 있습니다. Spring Boot는 자동 설정에서 기본적으로 CGLIB 프록시를 쓰고, `spring.aop.proxy-target-class=false`로 JDK 프록시로 바꿀 수 있습니다. 7.0부터는 `@Proxyable`로 빈 단위로 프록시 타입을 지정할 수도 있습니다.

```java
// 인터페이스 유무와 관계없이 클래스 프록시 강제
@EnableAspectJAutoProxy(proxyTargetClass = true)

// 7.0부터: 빈 단위로 지정
@Proxyable(TARGET_CLASS)   // 또는 INTERFACES
@Component
public class OrderService implements OrderApi { }
```

(공식 문서, Proxying Mechanisms) 인터페이스를 하나 이상 구현하면 JDK 프록시(구현한 모든 인터페이스를 프록시)이고, 없으면 CGLIB 서브클래스 프록시다. `proxyTargetClass` 속성은 `@EnableAspectJAutoProxy`, `@EnableTransactionManagement` 등에도 있고 모두 하나의 통합 auto-proxy creator로 합쳐져 가장 강한 설정이 적용된다. 7.0부터는 `@EnableAsync` 같은 개별 프록시 프로세서도 통합 전역 기본값에 참여한다. 코어 프레임워크는 인터페이스 기반을 기본으로 제안하지만 Spring Boot는 설정 프로퍼티에 따라 클래스 기반을 기본으로 켤 수 있다. `@Proxyable`은 `@Bean` 메서드나 `@Component` 클래스에서 전역 기본값을 덮어쓴다.
(공식 문서, Spring Boot AOP 페이지 4.1) Boot 자동 설정은 기본적으로 CGLIB 프록시를 쓰며, JDK 프록시를 쓰려면 `spring.aop.proxy-target-class`를 `false`로 설정한다. 프로퍼티 부록에서도 `spring.aop.proxy-target-class` 기본값이 `true`(true면 서브클래스 기반 CGLIB, false면 인터페이스 기반)다.
(실험 확인) Spring Framework의 `ProxyFactory`는 대상이 인터페이스를 구현하면 JDK 프록시(구체 클래스 타입이 아님), 구현하지 않으면 CGLIB 프록시(구체 클래스의 인스턴스)를 만들고, `setProxyTargetClass(true)`면 인터페이스가 있어도 서브클래스 프록시를 만든다. Boot 환경에서 인터페이스 기반 Spring Data 리포지토리는 JDK 동적 프록시다.
