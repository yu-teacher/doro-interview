---
slug: "jpa-36"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Spring Data JPA 프로젝션(인터페이스, DTO, 동적)은 어떻게 쓰고 무엇이 다른가요?"
keywords: ["인터페이스 프로젝션", "클로즈드", "오픈 프로젝션", "DTO", "동적 프로젝션"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html"]
---
**모범 답변 (30~60초)**
엔티티 전체가 아니라 필요한 속성만 읽는 기능입니다. 인터페이스 프로젝션은 getter만 선언하면 Spring Data가 프록시를 만들어 줍니다. 모든 접근자가 엔티티 속성과 일치하는 클로즈드 프로젝션이면 필요한 컬럼만 조회하도록 최적화할 수 있습니다. 반대로 @Value와 SpEL을 쓰는 오픈 프로젝션은 어떤 속성을 쓸지 알 수 없어 최적화가 안 됩니다. DTO 방식은 프록시 없이 클래스나 record를 쓰며 중첩 프로젝션은 지원하지 않습니다. 호출 시점에 타입을 고르려면 Class 파라미터를 받는 동적 프로젝션을 씁니다. JPA에서는 인터페이스 프로젝션이 Tuple 쿼리로, 직접 쓴 JPQL의 DTO는 생성자 표현식으로 동작합니다. 파생 쿼리에서 조인으로 풀리는 중첩 속성은 중첩 엔티티 전체를 가져온다는 점도 주의해야 합니다.

```java
record NamesOnly(String firstname, String lastname) {}

<T> Collection<T> findByLastname(String lastname, Class<T> type);
```

(공식 문서) projections 페이지의 인터페이스·클래스·동적 프로젝션, Query Optimization, Using Projections with JPA 절에 근거한다. DTO 생성자가 여러 개면 @PersistenceCreator로 지정해야 하고, JPQL 생성자 표현식에는 별칭을 쓰지 않는다고 문서가 설명한다.
