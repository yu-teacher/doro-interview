---
slug: "jpa-21"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "엔티티의 `equals`/`hashCode`는 어떻게 구현해야 하나요?"
keywords: ["자연 키(@NaturalId)", "id 기반 hashCode 위험", "프록시 고려", "Set"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
concepts: [equals-hashcode, entity-mapping]
importance: 2
links: [{to: "jpa-20", kind: PREREQ}, {to: "jl-09", kind: RELATED}, {to: "ds-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
같은 영속성 컨텍스트 안에서는 식별자마다 인스턴스가 하나뿐이라 기본 `Object` 구현으로 충분할 때도 있습니다. 하지만 Hibernate 입문서는 특히 연관을 `Set`으로 표현할 때 `equals`/`hashCode`를 재정의하라고 하고, 준영속 객체를 비교할 때도 필요합니다. 입문서의 권장은 데이터 모델상 인스턴스를 유일하게 식별하는 자연 키(`@NaturalId`, 예: email)를 기준으로 삼는 것입니다. 변경 가능한 필드와 DB가 생성하는 값은 hashCode에 넣지 말라고 합니다. 생성된 id 기반도 조심하면 가능하지만 id는 영속화된 뒤에야 채워지니 그 전에 해시 컬렉션에 넣으면 안 됩니다. 프록시가 올 수 있으므로 `getClass()` 대신 `instanceof`로 비교하고 필드 대신 getter로 접근합니다.

```java
@Override
public boolean equals(Object other) {
    return other instanceof Book                    // getClass() 아님
        && ((Book) other).getIsbn().equals(isbn);   // 자연 키 비교, getter 사용
}
@Override
public int hashCode() { return isbn.hashCode(); }
```

(공식 문서) Hibernate 입문서 3.25절이 위 원칙과 예제(자연 키 `isbn`에 `@NaturalId`)를 제시한다. 자연 키는 DB의 유니크 제약과 `equals`/`hashCode`에 쓰이는 필드에 대응해야 한다고 한다. Jakarta Persistence 3.2 사양 3.1절은 영속성 컨텍스트 안에서 식별자마다 유일한 엔티티 인스턴스가 있다고 한다.

(실험 확인) 같은 영속성 컨텍스트에서 `findById`를 두 번 호출하면 SELECT는 한 번이고 같은 인스턴스가 반환된다. 트랜잭션이 다르면 인스턴스와 SELECT도 달라진다. 영속 엔티티를 `detach`한 뒤 같은 id로 다시 조회하면 원래 객체와 다른 인스턴스가 반환되므로, 준영속 객체와 재조회 객체의 동등성은 `equals`로 판단해야 한다.
