---
slug: "jpa-02"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "JPA, Hibernate, Spring Data JPA의 관계는?"
keywords: ["JPA 명세", "Hibernate 구현체", "EntityManager", "Spring Data JPA는 편의 계층"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html", "https://docs.spring.io/spring-data/jpa/reference/repositories/core-concepts.html", "https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
JPA(Jakarta Persistence)는 자바 ORM의 표준 명세이고, `EntityManager` 같은 API와 매핑 어노테이션을 정의합니다. Hibernate는 이 명세를 구현한 구현체이자 명세보다 많은 고유 기능을 가진 ORM입니다. Spring Data JPA는 그 위에 얹은 편의 계층으로, `JpaRepository` 같은 리포지토리 인터페이스만 선언하면 CRUD 메서드와 메서드 이름에서 만든 쿼리를 제공합니다. 내부적으로는 `EntityManager`를 호출하고, 그 뒤에서 Hibernate가 SQL을 만듭니다. 예컨대 `save()`는 `persist` 또는 `merge`를 호출하므로, Spring Data JPA를 써도 영속성 컨텍스트와 flush 같은 JPA 동작을 알아야 합니다.

(공식 문서) Hibernate 입문서 1.1절은 Hibernate가 Jakarta Persistence의 영감이 되었고 이 명세의 최신 개정판의 완전한 구현을 포함한다고 설명하며, 구현 API로 `EntityManagerFactory`·`EntityManager`와 JPA 매핑 어노테이션을, 그 위에 네이티브 API(`SessionFactory`, `Session`)와 추가 어노테이션을 둔다고 설명한다. 사용자 가이드는 `Session`이 JPA에서는 `EntityManager`로 표현된다고 밝힌다. Spring Data JPA 문서는 Core concepts에서 `JpaRepository` 같은 저장소 기술별 인터페이스가 `CrudRepository`를 확장한다고 하고, 쿼리 메서드 절에서 리포지토리 프록시가 메서드 이름에서 쿼리를 만들거나 직접 정의한 쿼리를 쓴다고 설명하며, Persisting Entities 절은 `save`가 내부 `EntityManager`로 `persist`나 `merge`를 호출한다고 설명한다.
