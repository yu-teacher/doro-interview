---
slug: "ioc-14"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "싱글톤 빈에 prototype 또는 request 스코프 빈을 주입하면 어떤 문제가 생기나요?"
keywords: ["주입은 생성 시 1회", "ObjectProvider", "메서드(lookup) 주입", "스코프 프록시(CGLIB 기본)", "proxyMode"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", "https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html", "https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-method-injection.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/context/annotation/RequestScope.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html"]
concepts: [bean-lifecycle, proxy]
importance: 2
links: [{to: "ioc-06", kind: PREREQ}, {to: "misc-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
의존성은 싱글톤이 생성될 때 한 번만 해석됩니다. 그래서 싱글톤에 prototype을 주입하면 그 시점에 만들어진 인스턴스 하나만 계속 쓰게 되어 prototype의 의미가 사라지고, 수명이 짧은 request나 session 스코프 빈도 처음 주입된 객체에 고정됩니다. 해결책은 두 가지입니다. 매번 새 인스턴스가 필요하면 ObjectProvider를 주입해 필요할 때 getObject로 가져오거나 메서드 주입을 씁니다. 웹 스코프 빈은 스코프 프록시(proxyMode)를 쓰면 프록시가 호출 시점에 현재 요청이나 세션의 실제 대상을 찾아 위임합니다.

- (공식 문서) 문제 설명(싱글톤에 주입된 prototype은 유일하게 공급되는 인스턴스), `ObjectFactory`/`ObjectProvider`(`getObject()`, `getIfAvailable`, `getIfUnique`)와 JSR-330 `Provider`, 룩업 메서드 주입(CGLIB 서브클래싱이라 클래스와 메서드가 final이면 안 되고 `@Bean` 팩토리 메서드에는 쓸 수 없음), 스코프 프록시 동작이다. 스코프 프록시는 기본이 CGLIB 클래스 프록시이고 private 메서드는 가로채지 못하며, JDK 프록시는 스코프 빈이 인터페이스를 구현해야 한다. prototype 대상 스코프 프록시는 메서드 호출마다 새 대상 인스턴스를 만든다.
- (공식 문서, Javadoc) `@RequestScope`의 `proxyMode` 기본값은 `ScopedProxyMode.TARGET_CLASS`다(`@SessionScope`도 문서에서 같은 기본값을 보여 준다).
- (실험 확인) 싱글톤에 prototype을 주입하면 호출마다 같은 인스턴스이고, `ObjectProvider`로 지연 조회하면 호출마다 새 인스턴스를 얻는다.

```java
@Component
class CommandProcessor {
    private final ObjectProvider<Command> provider;
    CommandProcessor(ObjectProvider<Command> provider) { this.provider = provider; }
    void process() { provider.getObject().execute(); }   // 호출마다 새 prototype
}

@Component
@RequestScope                      // proxyMode 기본값 TARGET_CLASS: 싱글톤에 주입해도 요청별 대상에 위임
class RequestContext { }
```
