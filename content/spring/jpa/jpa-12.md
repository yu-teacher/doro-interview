---
slug: "jpa-12"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Hibernate 프록시는 무엇이고 어떻게 동작하나요?"
keywords: ["프록시 서브클래스", "초기화 시점 조회", "getReference", "id 접근은 로딩 없음", "final 불가", "Hibernate.initialize"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
LAZY 연관의 값으로 실제 엔티티 대신 프록시 객체를 넣어 둡니다. 프록시는 엔티티를 상속한 런타임 생성 클래스로, 처음 메서드를 호출할 때 영속성 컨텍스트로 실제 데이터를 조회해 내부 타깃에 채웁니다. **(공식)** 문서는 프록시가 동작하려면 클래스가 final이 아니어야 한다고 하고(userguide 3.4.2), 프록시의 id 조회는 초기화를 일으키지 않으며 `getReference()`로 쿼리 없이 연관을 설정할 수 있다고 설명합니다. 또 다형성 연관에서는 `instanceof`나 캐스팅이 프록시 때문에 어긋날 수 있고, 컨텍스트가 닫힌 뒤 초기화하면 예외가 납니다. 그래서 엔티티 `@NoArgsConstructor(access = PROTECTED)`처럼 프록시 생성이 가능한 형태로 만듭니다(데모 엔티티가 그렇게 선언됨).
