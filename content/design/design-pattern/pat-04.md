---
slug: "pat-04"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "Factory Method와 Abstract Factory는 무엇이고, JDK와 스프링에서는 어디에서 볼 수 있나요?"
keywords: ["객체 생성을 호출자에게서 숨김", "추상 팩토리 인터페이스에 의존", "구체 클래스 의존을 한 곳에", "정적 팩토리 메서드", "BeanFactory"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://objectmentor.com/resources/articles/Principles_and_Patterns.pdf", "https://gameprogrammingpatterns.com/flyweight.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html", "https://docs.spring.io/spring-framework/reference/core/beans/definition.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/BeanFactory.html"]
---
**모범 답변 (30~60초)**
둘 다 객체를 만드는 코드를 호출자에게서 감추는 생성 패턴입니다. Robert Martin은 Abstract Factory를 구체 클래스에 대한 의존을 한 곳에만 두게 해 주는 패턴으로 설명합니다. 사용자는 팩토리 인터페이스만 알고, 어떤 구현체가 만들어지는지는 모릅니다. Nystrom은 생성자를 감추고 이미 만든 객체가 있으면 그것을 돌려주는 구조를 Factory Method의 예로 듭니다. JDK에서는 `List.of`가 구현 클래스를 숨기고 `List`를 돌려주는 정적 팩토리이고, 스프링에서는 `BeanFactory`가 이름으로 구분한 빈 정의를 가진 중앙 레지스트리 역할을 하면서 인스턴스를 돌려줍니다.

```java
interface Modem { String dial(); }
interface ModemFactory { Modem make(); }      // 클라이언트는 이 인터페이스만 안다
class UsFactory implements ModemFactory { public Modem make() { return new Hayes(); } }
class EuFactory implements ModemFactory { public Modem make() { return new Ernie(); } }
String client(ModemFactory f) { return f.make().dial(); }
```

(원저자 자료) Martin, Design Principles and Design Patterns(2000), 쪽 번호(머리글 기준) 32의 "Abstract Factory" 절: 인스턴스를 만들려면 구체 클래스에 의존해야 하는데, 이 패턴은 그 의존을 한 곳으로 한정한다고 설명하고 `ModemFactory` 예를 든다. Nystrom, Game Programming Patterns, "Flyweight" 장은 이미 만든 인스턴스를 먼저 찾는 생성 방식을 생성자 뒤에 숨기는 것이 Factory Method의 예라고 한다.
(공식 문서) `List` 문서는 `List.of`와 `List.copyOf`를 정적 팩토리 메서드로 부른다. 스프링 Bean Definition 문서는 정적 팩토리 메서드와 인스턴스 팩토리 메서드로 빈을 만드는 방법을 설명하고, `BeanFactory` API 문서는 이를 빈 정의를 가진 중앙 레지스트리라고 한다.
(실험 확인) 위 `ModemFactory` 두 구현을 `client`에 넘기면 `hayes`, `ernie`가 나왔다. `List.of(1, 2, 3)`가 돌려준 실제 클래스는 `java.util.ImmutableCollections$ListN`이었지만 호출자는 `List` 타입만 쓰므로 이는 구현 세부 사항이다.
(보충) 두 패턴의 구분(Factory Method는 어떤 클래스를 만들지 서브클래스에 맡기는 메서드, Abstract Factory는 관련 객체군을 만드는 인터페이스)은 GoF 원서를 읽지 못해 일반적으로 알려진 설명을 적은 것이다.
