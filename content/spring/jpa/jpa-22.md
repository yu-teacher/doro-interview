---
slug: "jpa-22"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "쿼리 메서드, `@Query`, QueryDSL은 각각 언제 쓰나요?"
keywords: ["쿼리 메서드", "@Query(JPQL/native)", "QueryDSL 동적 쿼리", "@Modifying", "clearAutomatically"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", "https://docs.spring.io/spring-data/commons/reference/repositories/core-extensions.html", "https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html"]
---
**모범 답변 (30~60초)**
Spring Data는 메서드 이름에서 JPQL을 만들어 줍니다. 예컨대 `findByEmailAddressAndLastname`은 `where u.emailAddress = ?1 and u.lastname = ?2`에 해당하는 쿼리가 되므로, 조건이 단순할 때 가장 간결합니다. 이름이 길어지거나 조인, 서브쿼리가 필요하면 `@Query`로 JPQL(또는 네이티브)을 직접 쓰고, 이 쿼리는 `@NamedQuery`보다 우선합니다. 조건이 동적으로 바뀌는 검색 화면은 정적 타입으로 쿼리를 만드는 QueryDSL이나 `Specification`이 맞습니다. 어느 쪽이든 팀의 선택입니다(보충). `@Query`로 UPDATE/DELETE를 하려면 `@Modifying`이 필요하고, 컨텍스트를 자동으로 비우지 않으니 `clearAutomatically = true`를 고려합니다.

```java
@Modifying(clearAutomatically = true)
@Query("update Member m set m.name = :name where m.id = :id")
int rename(@Param("id") Long id, @Param("name") String name);
```

(공식 문서) Spring Data JPA 레퍼런스 "JPA Query Methods"는 메서드 이름에서 쿼리를 만드는 방식과 `@Query` 선언 방식을 소개하고, 이름이 지나치게 길어지거나 파서가 지원하지 않는 키워드가 필요한 경우 named query나 `@Query`를 쓰라고 한다. `@Query` 쿼리는 `@NamedQuery`나 orm.xml의 named query보다 우선한다고 밝히며, `@NativeQuery`로 네이티브 쿼리를 실행할 수 있다고 한다. "Modifying Queries" 절은 `@Modifying`이 해당 쿼리를 select가 아닌 갱신 쿼리로 실행하게 하고, 수정 쿼리 뒤 `EntityManager`에 오래된 엔티티가 남을 수 있어 자동으로 비우지 않으며 `clearAutomatically`를 true로 주면 비운다고 한다. `@Modifying`은 `@Query`와 함께일 때만 의미 있고 파생 쿼리나 커스텀 메서드에는 필요 없다고 한다. Spring Data Commons 문서의 Querydsl 절은 Querydsl을 정적 타입의 SQL 유사 쿼리 프레임워크로 설명하고, `QuerydslPredicateExecutor`로 `Predicate`를 `and` 등으로 조합해 type-safe하게 조회하는 예를 보여 준다. 또한 Querydsl의 유지보수가 느려져 커뮤니티 포크(OpenFeign)가 생겼고 Spring Data가 이를 최선 노력으로 지원한다고 한다. JPA 레퍼런스의 Specifications 절은 `Specification` 조합으로 쿼리 메서드 조합마다 선언할 필요를 없앨 수 있다고 한다.
(보충) 동적 검색 화면에서 QueryDSL이나 `Specification`이 어울린다는 선택 기준은 문서가 직접 제시한 규칙이 아니라 위 서술에서 도출한 실무 판단이다. 기준은 Spring Data JPA 4.x 문서이다.
