---
slug: "jpa-19"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "cascade와 orphanRemoval은 무엇이고 주의점은?"
keywords: ["CascadeType.ALL", "orphanRemoval", "단일 소유자일 때만", "컬렉션 교체 주의"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
cascade는 부모의 영속성 전이를 자식에게 전파하는 옵션입니다. `CascadeType.ALL`이면 부모를 persist/remove할 때 자식도 같이 됩니다. orphanRemoval은 부모 컬렉션에서 자식이 제거되면 고아가 된 자식을 DELETE하는 옵션입니다. 데모 `Member`는 둘 다 설정해서, 회원을 지우면 게시글도 함께 지워지고 컬렉션에서 뺀 게시글도 삭제됩니다. 주의점은 자식을 다른 엔티티도 참조하거나 독립 생명주기를 가질 때는 쓰면 안 된다는 것입니다. 단일 소유자(부모)가 생명주기를 전부 책임지는 경우(예: 주문-주문항목)에만 씁니다. 또 컬렉션 참조를 통째로 교체하면 orphanRemoval과 충돌할 수 있어 add/remove로 다루는 게 안전합니다(보충). **(공식)** Hibernate 사용자 가이드는 6.15절에서 cascading을 다룹니다(이번에 세부 확인은 못 함).
