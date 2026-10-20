---
slug: "jpa-02"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "JPA, Hibernate, Spring Data JPA의 관계는?"
keywords: ["JPA 명세", "Hibernate 구현체", "EntityManager", "Spring Data JPA는 편의 계층"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
JPA는 자바 ORM 표준 명세(인터페이스)이고, Hibernate는 그 대표적인 구현체입니다. Spring Data JPA는 JPA 위에 얹은 추상화로, `JpaRepository` 인터페이스만 선언하면 CRUD와 쿼리 메서드 구현을 만들어 줍니다. 내부적으로는 결국 `EntityManager`를 호출하고, 그 뒤에서 Hibernate가 SQL을 만듭니다. 그래서 Spring Data JPA를 써도 영속성 컨텍스트와 플러시 같은 JPA 동작을 알아야 합니다.
