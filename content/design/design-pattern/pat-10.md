---
slug: "pat-10"
topic: "design-pattern"
tier: BASIC
difficulty: 2
title: "프록시 패턴은 무엇이고, `java.lang.reflect.Proxy`로는 어떻게 프록시를 만드나요?"
keywords: ["대리 객체", "InvocationHandler", "인터페이스 구현 클래스를 런타임 생성", "호출 가로채기", "구체 클래스로 캐스팅 불가"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/reflect/Proxy.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/reflect/InvocationHandler.html"]
concepts: [proxy, gof-patterns]
importance: 3
links: [{to: "pat-11", kind: FOLLOWUP}, {to: "aop-04", kind: RELATED}, {to: "aop-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
프록시는 실제 객체 대신 같은 인터페이스를 제공하면서 호출을 가로채 부가 작업을 하거나 접근을 제어하는 대리 객체입니다. JDK는 `Proxy.newProxyInstance`로 지정한 인터페이스들을 구현하는 클래스를 런타임에 만들고, 그 인스턴스의 모든 메서드 호출을 `InvocationHandler`의 `invoke`로 보냅니다. 핸들러는 호출된 `Method`와 인자를 받아 원하는 처리를 한 뒤 대상 객체를 호출할 수 있습니다. 프록시 클래스는 인터페이스만 구현하는 `final` 클래스라서 구체 클래스 타입으로는 캐스팅할 수 없습니다.

```java
Service proxy = (Service) Proxy.newProxyInstance(Service.class.getClassLoader(),
    new Class<?>[]{Service.class},
    (p, m, args) -> { calls.add(m.getName()); return m.invoke(target, args); });
proxy.foo();                                      // 핸들러를 거쳐 target.foo() 호출
SimpleService s = (SimpleService) (Object) proxy; // ClassCastException
```

(공식 문서) `Proxy` 문서는 지정한 인터페이스들을 구현하는 프록시 클래스를 런타임에 만들고, 프록시 인스턴스의 메서드 호출이 연결된 `InvocationHandler`의 `invoke`로 전달되며, 프록시 클래스는 `final`이고 지정된 인터페이스만 정확히 구현한다고 설명한다. `InvocationHandler` 문서는 `invoke`가 프록시, 호출된 `Method`, 인자를 받는다고 한다.
(실험 확인) 위 코드에서 `proxy.foo()` 호출이 핸들러에 기록되었고, `Proxy.isProxyClass`는 true, 클래스 이름은 `$Proxy` 뒤에 번호가 붙은 형태였으며 `final`이었다. 프록시를 구체 클래스 `SimpleService`로 캐스팅하면 `ClassCastException`이었다(Corretto 25.0.3).
(보충) 프록시 패턴의 일반 정의(대상 객체에 대한 접근을 대리하는 객체)는 GoF 원서를 읽지 못해 일반적으로 알려진 설명을 적은 것이다.
