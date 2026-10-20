---
slug: "jpa-25"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Spring Data JPA 리포지토리는 인터페이스만 만들었는데 어떻게 동작하나요?"
keywords: ["리포지토리 프록시", "SimpleJpaRepository", "쿼리 메서드 파싱", "JpaRepositoryFactory(보충)", "인터페이스 계층"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
애플리케이션 시작 시 Spring Data가 `Repository`를 상속한 인터페이스를 스캔해서, 각 인터페이스마다 프록시 빈을 만들어 등록합니다. 이 프록시의 실제 구현체는 `SimpleJpaRepository`로, `save`, `findById` 같은 CRUD 메서드가 여기에 구현되어 있고 `@Transactional`도 이 클래스에 선언되어 있습니다. **(공식)** 트랜잭션 문서가 `SimpleJpaRepository`의 설정을 따른다고 언급합니다. 인터페이스에 선언한 쿼리 메서드는 이름을 파싱하거나 `@Query`를 읽어 쿼리를 만들고 인터셉터 체인으로 실행합니다. 팩토리가 프록시를 만드는 세부 구조(`JpaRepositoryFactory` 등)는 공식 문서의 해당 페이지를 읽지 못했고 기억에 기반한 설명입니다(보충). 리포지토리 계층 구조는 `Repository` → `CrudRepository` → `PagingAndSortingRepository` → `JpaRepository` 순입니다 **(공식)**.
