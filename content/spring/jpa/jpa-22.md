---
slug: "jpa-22"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "쿼리 메서드, `@Query`, QueryDSL은 각각 언제 쓰나요?"
keywords: ["쿼리 메서드", "@Query(JPQL/native)", "QueryDSL 동적 쿼리", "@Modifying", "clearAutomatically"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
**(공식)** Spring Data는 메서드 이름에서 JPQL을 만들어 줍니다. 예컨대 `findByEmailAddressAndLastname`은 그에 해당하는 where절 쿼리가 됩니다. 조건이 한두 개로 단순할 때 가장 간결합니다. 이름이 길어지거나 조인, 서브쿼리가 필요하면 `@Query`로 JPQL을 직접 쓰고, 이 경우 `@NamedQuery`보다 우선합니다. 조건이 동적으로 바뀌는 검색 화면은 QueryDSL(보충: Spring Data 문서 외 별도 라이브러리)이 컴파일 타임 타입 안정성과 동적 조건 조합에서 유리합니다. 참고로 `@Query`로 UPDATE/DELETE를 하려면 `@Modifying`이 필요하고, 기본적으로 영속성 컨텍스트를 비우지 않아 `clearAutomatically = true`를 고려합니다.

```java
@Modifying(clearAutomatically = true)
@Query("update Member m set m.name = :name where m.id = :id")
int rename(@Param("id") Long id, @Param("name") String name);
```
