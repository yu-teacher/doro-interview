---
slug: "jpa-08"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "Spring Data JPA의 `save()`는 persist인가 merge인가?"
keywords: ["SimpleJpaRepository.save", "isNew 판단", "@Version null", "id null", "Persistable", "merge는 복사본 반환"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
둘 다이고, 엔티티가 새것인지에 따라 갈립니다. Spring Data JPA 문서에 따르면 새 엔티티면 `EntityManager.persist`, 아니면 `merge`를 호출합니다. 새것인지 판단하는 기본 규칙은 두 가지로, 래퍼 타입 `@Version` 필드가 있으면 그 값이 null일 때 새것이고, 없으면 id가 null일 때 새것입니다. 그래서 id를 직접 할당하는 엔티티는 id가 null이 아니므로 새것으로 판단되지 않아 merge가 호출됩니다. 이럴 땐 `Persistable`을 구현해 `isNew()`를 직접 제어하는 방식을 공식 문서가 안내합니다. IDENTITY로 id를 생성하면 새 엔티티의 id는 null이라 persist가 호출되고, merge는 전달한 객체가 아니라 반환된 복사본이 영속 상태가 됩니다.

(공식 문서) Spring Data JPA 문서 Persisting Entities 절은 `save`가 내부 `EntityManager`로 엔티티를 persist하거나 merge하며, 아직 영속화되지 않은 엔티티면 `persist`, 아니면 `merge`를 호출한다고 한다. 새 엔티티 판단 기본 전략은 먼저 래퍼(비원시) 타입 `@Version` 속성이 있는지 보고 있으면 값이 null일 때 새것으로 보며, 없으면 식별자가 null일 때 새것으로 본다. JPA에서는 0도 첫 번째 버전으로 쓰이므로 원시 타입 version 속성으로는 새것 여부를 판단할 수 없다고 한다. `Persistable`을 구현하면 `isNew()`로 판단을 위임하며, 직접 할당 식별자에 version 속성이 없으면 식별자가 항상 non-null이라는 점과 `@PostPersist` 콜백으로 플래그를 뒤집는 기반 클래스 패턴을 소개한다. 사양 3.3.7.1절은 merge가 준영속 엔티티의 상태를 같은 식별자의 기존 관리 인스턴스에 복사하거나 새 관리 복사본을 만든다고 하며, 영속화 연산(persist)은 새 엔티티 X 자체를 관리 상태로 만든다고 한다(3.3.2절).
(보충) id를 직접 할당한 새 엔티티를 merge하면 불필요한 SELECT가 먼저 나간다는 설명은 문서 문장이 아니라 merge가 같은 식별자의 기존 인스턴스를 확인해야 한다는 의미에서의 추론이다. 아래 실험은 준영속 엔티티의 merge에서 SELECT 후 UPDATE가 나가는 것까지 확인했다.

(실험 확인) 새 엔티티의 `save()`는 추가 SELECT 없이 INSERT 한 번이 나가고 전달한 인스턴스 자체가 영속 상태가 된다. 준영속 엔티티의 `save()`는 SELECT 후 UPDATE가 나가고, 반환값만 영속 상태이며 원본은 준영속 그대로다.

```java
// merge는 "전달한 객체"가 아니라 "반환된 객체"가 영속 상태다
Member saved = memberRepository.save(member);   // 항상 반환값을 쓰자
```
