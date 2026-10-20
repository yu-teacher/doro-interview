---
slug: "pat-24"
topic: "design-pattern"
tier: TRICKY
difficulty: 2
title: "프로토타입 패턴과 `Object.clone()`은 어떤 관계이고, 스프링의 prototype 스코프와는 같은 건가요?"
keywords: ["기존 객체를 복제해 생성", "Cloneable", "clone은 얕은 복사", "깊은 복사와 얕은 복사", "prototype 스코프는 매번 새 인스턴스"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://gameprogrammingpatterns.com/prototype.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Cloneable.html", "https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/BeanFactory.html"]
---
**모범 답변 (30~60초)**
프로토타입은 기존 객체를 본보기 삼아 자기와 비슷한 객체를 복제해 만드는 패턴입니다. 자바에서는 `Cloneable`과 `Object.clone()`이 그 용도지만 `Object.clone`은 필드를 그대로 대입하는 얕은 복사라서, 가변 객체를 참조하는 필드는 원본과 복제본이 함께 씁니다. Nystrom도 깊은 복사인지 얕은 복사인지가 올바른 `clone`을 짜기 까다롭게 한다고 지적합니다. 한편 스프링의 prototype 스코프는 복제가 아니라 요청할 때마다 빈 정의로 새 인스턴스를 만드는 것이고, 컨테이너가 생성 이후 생명주기를 관리하지 않아 소멸 콜백이 호출되지 않습니다.

```java
static class Monster implements Cloneable {
    String name; List<String> items = new ArrayList<>();
    @Override public Monster clone() {
        try { return (Monster) super.clone(); } catch (CloneNotSupportedException e) { throw new AssertionError(e); }
    }
}
// c = ghost.clone(); c.items.add("chain");  -> ghost.items 에도 chain 이 보인다 (같은 리스트 공유)
```

(원저자 자료) Nystrom, "Prototype" 장: 객체가 자기와 비슷한 객체를 만들어 낼 수 있다는 것이 핵심이며, 기반 클래스에 추상 `clone()`을 두는 방식이다. 저자는 올바른 `clone()`을 짜는 데 깊은/얕은 복사 같은 의미상 함정이 있고, 이 패턴이 최선의 답이라고 느낀 경우를 아직 찾지 못했다고 쓴다. 이는 저자의 의견이다.
(공식 문서) `Object.clone` 문서는 기본 구현이 클래스가 `Cloneable`을 구현하지 않으면 `CloneNotSupportedException`을 던지고, 구현했으면 필드 내용을 그대로 복사하되 필드가 가리키는 객체는 복제하지 않는 얕은 복사라고 하며, 독립성이 필요하면 내부의 가변 객체를 복사해 교체해야 한다고 한다. `Cloneable` 문서는 이 인터페이스가 `Object.clone()`에게 필드 단위 복사가 합법임을 알린다고 한다. 스프링 Bean Scopes 페이지는 prototype 스코프가 요청할 때마다 새 빈 인스턴스를 만들고, 컨테이너가 이후 기록을 두지 않아 소멸 콜백이 호출되지 않으며 `new` 연산자를 대체하는 역할이라고 한다. `BeanFactory` API 문서는 빈 정의에 따라 독립 인스턴스를 돌려주는 것을 프로토타입 디자인 패턴이라고 부른다.
(실험 확인) `clone()`한 복제본은 다른 객체였지만 `items` 리스트는 원본과 같은 객체여서, 복제본에 추가한 항목이 원본에도 보였다. `items`를 새 리스트로 교체한 깊은 복사에서는 원본이 그대로였다. `Cloneable`을 구현하지 않은 클래스에서 `super.clone()`을 부르면 `CloneNotSupportedException`이었다(Corretto 25.0.3).
(보충) 스프링 prototype 스코프가 `clone()`이 아니라 빈 정의로 새로 인스턴스화한다는 대비는 문서의 "instantiates, configures" 서술에서 읽어 낸 해석이다. 문서는 prototype 스코프의 내부 생성 방식을 `clone`과 비교해 설명하지 않는다.
