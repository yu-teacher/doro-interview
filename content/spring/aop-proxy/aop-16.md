---
slug: "aop-16"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "프록시 객체를 직접 주입받으면 클래스 타입이 원본과 다른데, 왜 문제없나요?"
keywords: ["JDK 프록시는 인터페이스 타입만", "CGLIB은 서브클래스", "구체 타입 주입 호환"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/introduction-proxies.html", "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html"]
---
**모범 답변 (30~60초)**
JDK 프록시는 대상이 구현한 인터페이스를 구현할 뿐 대상 클래스와는 무관한 타입이어서, 인터페이스 타입으로 받아야 하고 구체 클래스 타입으로는 받을 수 없습니다. 문서도 CGLIB을 강제하는 이유로 "인터페이스에 선언되지 않은 메서드를 어드바이스해야 할 때"와 "프록시를 구체 타입으로 메서드에 넘겨야 할 때"를 듭니다. CGLIB 프록시는 대상 클래스의 런타임 서브클래스라서 구체 클래스 타입으로 주입받아도 타입이 호환됩니다. 그래서 인터페이스가 없는 클래스는 자연스럽게 CGLIB이 쓰이고, 구체 타입이 필요하면 `proxyTargetClass`로 CGLIB을 강제합니다.

(공식 문서, AOP Proxies / Proxying Mechanisms) 기본은 JDK 동적 프록시이고, 비즈니스 객체가 인터페이스를 구현하지 않으면 CGLIB을 쓴다. 인터페이스에 선언되지 않은 메서드를 어드바이스해야 하거나 프록시된 객체를 구체 타입으로 메서드에 넘겨야 하는 (드문) 경우 CGLIB을 강제할 수 있다. CGLIB 프록시는 대상 타입의 런타임 생성 서브클래스다.
(실험 확인) 인터페이스 기반 JDK 프록시를 구현 클래스 타입으로 캐스팅하면 `ClassCastException`이 나고, JDK 프록시는 구현 클래스의 인스턴스가 아니다. `proxyTargetClass=true`로 만든 CGLIB 프록시는 구체 클래스와 인터페이스의 인스턴스이며 `getSuperclass()`가 대상 클래스다. JDK 동적 프록시는 인터페이스가 없는 클래스로는 만들 수 없다(`IllegalArgumentException`).
