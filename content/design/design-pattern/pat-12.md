---
slug: "pat-12"
topic: "design-pattern"
tier: TRICKY
difficulty: 2
title: "같은 클래스 안에서 다른 메서드를 `this`로 호출하면 왜 AOP 어드바이스가 적용되지 않나요?"
keywords: ["프록시를 거치지 않는 호출", "this 참조로 직접 호출", "자기 호출 시 어드바이스 건너뜀", "자기 호출이 없도록 리팩터링", "자기 참조 주입"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/reflect/Proxy.html"]
---
**모범 답변 (30~60초)**
프록시를 거치지 않기 때문입니다. 클라이언트는 프록시 참조를 들고 있어서 첫 호출은 프록시를 통과해 어드바이스가 실행되지만, 호출이 타깃 객체에 도달한 뒤에는 타깃이 자기 `this`로 다른 메서드를 부르므로 프록시를 우회합니다. 스프링 문서는 명시적이든 암시적이든 `this`를 통한 자기 호출은 어드바이스를 건너뛴다고 설명하고, 가장 덜 침습적인 해법으로 자기 호출이 생기지 않도록 코드를 리팩터링하라고 합니다. 대안으로 자기 참조를 주입받아 프록시를 통해 호출할 수 있고, `AopContext.currentProxy()`는 스프링 AOP에 코드를 묶으므로 강하게 비권장입니다.

```java
static class SimpleService implements Service {
    public String foo() { return "foo->" + this.bar(); }   // this 호출은 프록시를 거치지 않는다
    public String bar() { return "bar"; }
}
// proxy.foo()  -> 핸들러가 본 호출: [foo]
// proxy.bar()  -> 핸들러가 본 호출: [bar]
```

(공식 문서) Understanding AOP Proxies 절은 프록시 참조를 쥔 클라이언트의 호출은 프록시가 모든 관련 인터셉터에 위임하지만, 일단 타깃에 도달하면 타깃이 스스로 호출하는 `this.bar()` 같은 호출은 프록시가 아니라 `this` 참조로 실행되어 어드바이스가 실행될 기회가 없다고 설명한다. 해법으로 자기 호출을 피하도록 리팩터링하는 것이 최선이고, 자기 주입으로 프록시를 통해 호출하는 방법이 있으며, `AopContext.currentProxy()`는 마지막 수단이라고 한다.
(실험 확인) 스프링이 아니라 `java.lang.reflect.Proxy`로 같은 구조를 만들었다(대상은 `foo()`에서 `this.bar()`를 호출). `proxy.foo()`를 호출하면 핸들러는 `[foo]`만 기록했고 내부의 `bar` 호출은 기록되지 않았다. `proxy.bar()`를 직접 호출하면 `[bar]`가 기록되었다. 스프링 AOP도 프록시 기반이라는 점은 문서가 설명하며, 스프링 자체는 실행하지 않았다.
