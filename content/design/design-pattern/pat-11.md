---
slug: "pat-11"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "스프링 AOP는 프록시를 어떻게 만들고, JDK 동적 프록시와 CGLIB은 무엇이 다른가요?"
keywords: ["인터페이스가 있으면 JDK 프록시", "없으면 CGLIB 서브클래스", "final 클래스·메서드 프록시 불가", "private 메서드 어드바이스 불가", "프록시 방식 강제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-proxies.html"]
---
**모범 답변 (30~60초)**
스프링 AOP는 프록시 기반입니다. 대상이 인터페이스를 하나라도 구현하면 JDK 동적 프록시를 쓰고 그 인터페이스들을 프록시합니다. 인터페이스가 없으면 대상 클래스를 상속한 서브클래스를 런타임에 만드는 CGLIB 프록시를 씁니다. CGLIB은 상속에 기대므로 `final` 클래스는 프록시할 수 없고, `final`이나 `private` 메서드는 오버라이드할 수 없어 어드바이스를 적용하지 못합니다. 설정으로 CGLIB을 강제할 수 있는데, 프레임워크 기본은 인터페이스 기반이지만 Spring Boot는 설정에 따라 클래스 기반을 기본으로 켤 수 있습니다.

(공식 문서) Proxying Mechanisms 페이지: 대상이 인터페이스를 하나 이상 구현하면 JDK 동적 프록시가 쓰이고 구현한 모든 인터페이스가 프록시되며, 인터페이스가 없으면 대상 타입의 런타임 생성 서브클래스인 CGLIB 프록시가 만들어진다. CGLIB을 강제할 때의 제약으로 `final` 클래스는 확장할 수 없어 프록시 불가, `final` 메서드와 `private` 메서드는 오버라이드할 수 없어 어드바이스 불가, 다른 패키지의 부모 클래스에 있는 패키지 전용 메서드도 사실상 `private`이라 불가라고 한다. 전역 기본값은 설정에 따라 다를 수 있어 코어 프레임워크는 인터페이스 기반을 기본으로 권하지만 Spring Boot는 설정 속성에 따라 클래스 기반을 기본으로 켤 수 있으며, 7.0부터는 `@Proxyable`로 빈별로 프록시 종류를 지정할 수 있다고 한다. AOP Proxies 페이지도 JDK 동적 프록시가 기본이고 CGLIB은 클래스를 프록시해야 할 때 쓰며 인터페이스가 없으면 기본으로 CGLIB을 쓴다고 한다.
JDK 프록시의 동작 자체는 `pat-10`의 실험으로 확인했고, 스프링은 실행하지 않아 이 문서 내용은 공식 문서 근거로만 적었다.
