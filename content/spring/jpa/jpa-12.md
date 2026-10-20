---
slug: "jpa-12"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Hibernate 프록시는 무엇이고 어떻게 동작하나요?"
keywords: ["프록시 서브클래스", "초기화 시점 조회", "getReference", "id 접근은 로딩 없음", "final 불가", "Hibernate.initialize"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/"]
---
**모범 답변 (30~60초)**
LAZY 연관의 값으로 실제 엔티티 대신 프록시 객체를 넣어 둡니다. 프록시는 엔티티 클래스를 상속해 런타임에 만들어지는 객체로, 상태는 비어 있다가 처음 메서드를 호출하면 영속성 컨텍스트로 DB에서 상태를 가져온 뒤 실제 호출을 진행합니다. 프록시를 만들려면 보통 엔티티 클래스가 final이 아니어야 하고 기본 생성자가 package 이상의 가시성이어야 합니다. 프록시의 id 조회는 초기화를 일으키지 않고, `getReference()`로 쿼리 없이 연관을 설정할 수 있으며, `Hibernate.initialize`로 강제 초기화할 수 있습니다. 다만 다형성 연관에서는 `instanceof`와 캐스팅이 어긋날 수 있고, 컨텍스트가 닫힌 뒤 초기화하면 `LazyInitializationException`이 납니다.

(공식 문서) 입문서 5.6절은 프록시를 실제 엔티티나 컬렉션인 척하지만 상태를 갖지 않는 객체로 설명하고, 메서드를 부르면 Hibernate가 호출을 가로채 DB에서 상태를 가져온 뒤 실제 객체로 진행시킨다고 한다. 프록시가 동작하는 것은 영속성 컨텍스트에 연결된 엔티티뿐이며, 세션이 끝나면 `LazyInitializationException`이 나고, 다형성 연관에서는 구체 타입을 몰라 `instanceof`와 형변환이 올바르게 동작하지 않는다고 한다. 같은 절은 프록시에서 식별자를 얻는 것과, `getReference`로 만든 프록시를 연관으로 설정하는 것은 DB를 조회하지 않는다고 하고 `Hibernate.isInitialized`와 `Hibernate.initialize`를 소개한다. 사용자 가이드 3.4.2절은 프록시를 쓰려면 엔티티 클래스가 final이 아니거나 모든 getter/setter를 선언한 인터페이스를 구현해야 하며 final 클래스는 영속화는 되어도 지연 연관용 프록시를 쓸 수 없다고 한다. 3.4.3절은 런타임 프록시를 쓰려면 기본 생성자를 package 이상의 가시성으로 두라고 한다(JPA 자체는 public 또는 protected를 요구). 6.5절은 클래스가 final이 아니면 프록시가 엔티티를 상속한다고 설명한다.

(실험 확인) LAZY 연관으로 가져온 객체는 엔티티의 하위 클래스인 프록시다(`getClass()`는 다르고 `instanceof`는 참). `getId()`는 초기화하지 않고 SQL도 없으며, 다른 속성에 접근하면 SELECT가 한 번 나가 초기화된다. 이미 컨텍스트에 로딩된 엔티티를 참조하면 프록시가 아니라 실제 객체가 반환된다. 트랜잭션 밖에서는 `getId()`는 되지만 다른 속성 접근은 `LazyInitializationException`이다. 엔티티는 protected 기본 생성자를 가진 비final 클래스였다.

```java
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // 프록시 생성이 가능한 형태 (비final, protected 기본 생성자)
public class Post { /* ... */ }
```
