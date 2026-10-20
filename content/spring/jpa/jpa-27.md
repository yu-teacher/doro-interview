---
slug: "jpa-27"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "`findById`와 `getReferenceById`(구 `getOne`)는 어떻게 다른가요?"
keywords: ["find vs getReference", "프록시", "쿼리 절약", "예외 지연"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/JpaRepository.html", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
`findById`는 즉시 쿼리를 날려 실제 엔티티를 `Optional`로 줍니다. `getReferenceById`는 DB 조회 없이 프록시를 돌려주고, 프록시의 id 접근은 조회를 일으키지 않으며 다른 속성을 처음 접근할 때 로딩합니다. 대상이 없으면 그 접근 시점에 `EntityNotFoundException`이 납니다. 그래서 게시글을 쓸 때 작성자의 존재 확인이 필요 없고 FK만 필요하다면 `getReferenceById`로 SELECT 한 번을 아낄 수 있습니다. 구 `getOne`과 `getById`는 deprecated이고 `getReferenceById`를 쓰라고 합니다. JPA `EntityManager.getReference`에 대응한다는 설명은 문서로 확인하지 못했습니다(보충).

(공식 문서) Hibernate 입문서 5.6절은 로딩되지 않은 프록시에서 식별자를 얻거나 `getReference()`로 얻은 프록시로 연관을 설정하는 것은 DB 조회를 일으키지 않는다고 하고, 5.4절의 표는 `getReference`가 상태를 DB에서 로딩하지 않고 참조를 얻으며 이를 제외한 읽기 연산은 즉시 DB에 접근한다고 한다. `JpaRepository.getReferenceById` Javadoc은 구현에 따라 대개 인스턴스를 항상 반환하고 첫 접근 때 `EntityNotFoundException`을 던지며, 일부 구현은 잘못된 식별자를 즉시 거부한다고 한다. `getOne`과 `getById`는 `getReferenceById`로 대체하라는 deprecated 표시가 붙어 있다. Jakarta Persistence 3.2 사양 3.12절은 `getReference`로 얻은 참조에 접근했는데 엔티티가 없으면 `EntityNotFoundException`이 던져진다고 한다.

(실험 확인) `getReferenceById` 호출 직후에는 SQL이 실행되지 않고 프록시는 초기화되지 않은 상태이며, `getId()`를 불러도 SQL이 없다. `getName()`처럼 다른 속성에 접근하면 SELECT가 한 번 나가고 초기화된다. 반면 `findById`는 호출 시점에 SELECT가 한 번 실행된다.

```java
Member ref = memberRepository.getReferenceById(id);   // SELECT 없음
ref.getId();                                           // SELECT 없음
ref.getName();                                         // 이때 SELECT 1회
```
