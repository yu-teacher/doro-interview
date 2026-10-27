---
slug: "jpa-19"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "cascade와 orphanRemoval은 무엇이고 주의점은?"
keywords: ["CascadeType.ALL", "orphanRemoval", "단일 소유자일 때만", "컬렉션 교체 주의"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html", "https://docs.hibernate.org/orm/7.0/userguide/html_single/"]
concepts: [entity-mapping, ddd]
importance: 2
links: [{to: "jpa-18", kind: PREREQ}, {to: "jpa-31", kind: FOLLOWUP}, {to: "jpa-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
cascade는 부모에 적용한 상태 전이를 연관된 자식에게 전파하는 옵션입니다. `CascadeType.ALL`이면 부모를 persist하거나 remove할 때 자식에게도 같은 연산이 적용됩니다. orphanRemoval은 부모 컬렉션에서 자식을 제거하면 고아가 된 자식에 remove가 적용되어 flush 시점에 삭제되는 옵션입니다. 사양은 이것이 부모가 단독으로 소유하는 자식을 위한 기능이라고 하므로, 자식을 다른 엔티티도 참조하거나 독립 생명주기를 가지면 쓰면 안 되고 주문-주문항목처럼 부모가 생명주기를 전부 책임질 때만 씁니다. 또 컬렉션 참조를 통째로 교체하면 문제가 생길 수 있어 add/remove로 다루는 게 안전합니다(보충).

```java
@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Post> posts = new ArrayList<>();
```

(공식 문서) Jakarta Persistence 3.2 사양 3.3.2절과 3.3.3절은 persist·remove 연산이 `cascade=PERSIST`/`REMOVE` 또는 `ALL`인 관계의 대상에 전파된다고 한다. 2.11절은 orphanRemoval이 OneToOne·OneToMany에서 지원되고, 관계에서 제거된 대상에 flush 시점에 remove가 적용되며, 이 기능은 부모 엔티티가 "private하게 소유"하는 엔티티를 위한 것이라고 한다. 이식 가능한 애플리케이션은 고아가 된 엔티티를 다른 관계로 재할당하거나 다시 persist하면 안 되고, 고아가 된 대상이 이미 준영속·신규·삭제 상태이면 orphanRemoval 의미가 적용되지 않는다고 한다. 같은 절은 `cascade=REMOVE`를 OneToOne·OneToMany에만 적용하라고 하고, 그렇지 않으면 이식성이 없다고 한다. Hibernate 사용자 가이드 6.15절은 cascade 종류를 소개하며 `CascadeType.ALL`이 모든 전이를 전파한다고 설명한다.

(실험 확인) 회원 엔티티에 위 매핑을 둔 상태에서, 회원만 `save`해도 컬렉션에 담은 게시글 2개가 함께 INSERT된다. 컬렉션에서 게시글 하나를 제거하고 커밋하면 그 행만 DELETE되고 나머지는 남는다. 회원을 삭제하면 게시글도 함께 삭제되며(삭제된 엔티티 수 3 = 회원 1 + 게시글 2) FK 위반이 없다.
(보충) 컬렉션 인스턴스를 새 컬렉션으로 교체하면 orphanRemoval과 충돌할 수 있다는 점은 문서로 확인하지 못했다.
