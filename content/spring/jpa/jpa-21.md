---
slug: "jpa-21"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "엔티티의 `equals`/`hashCode`는 어떻게 구현해야 하나요?"
keywords: ["자연 키(@NaturalId)", "id 기반 hashCode 위험", "프록시 고려", "Set"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
같은 영속성 컨텍스트 안에서는 동일성이 보장되어 기본 `Object` 구현으로 충분한 경우가 많습니다. 하지만 `Set`에 담거나 준영속 객체를 비교할 때는 직접 구현이 필요합니다. 어려운 점은 IDENTITY처럼 persist 후에야 id가 채워지는 경우 id 기반 hashCode가 바뀌어 컬렉션이 깨진다는 것입니다. **(공식)** Hibernate 입문서는 equals/hashCode의 기반으로 `@NaturalId`(자연 키, 예: email)를 쓰는 걸 제안합니다. 데모의 `Member.email`처럼 유일하고 안 바뀌는 값이 후보입니다. 프록시를 고려해서 `getClass()` 대신 `instanceof`로 비교하고 필드 대신 getter로 접근하는 것도 흔한 관행입니다(보충).
