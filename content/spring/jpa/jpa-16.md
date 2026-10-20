---
slug: "jpa-16"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "fetch join, `@EntityGraph`, batch size는 어떻게 선택하나요?"
keywords: ["ToOne은 fetch join", "컬렉션은 batch size", "카테시안 곱", "EntityGraph type FETCH/LOAD"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
**(공식)** 문서 기준으로 outer join fetching이 보통 가장 효율적이고, 단 한 번에 두 개 이상의 컬렉션을 조인하면 카테시안 곱이 생겨 subselect가 낫다고 합니다. 저는 ToOne 연관은 fetch join이나 EntityGraph로 가져오고, 컬렉션은 batch size로 보완하는 구성을 기본으로 삼습니다(보충). `@EntityGraph`는 Spring Data 쿼리 메서드에 붙이기만 하면 되어 간편하고, 복잡한 조건은 `@Query`의 `join fetch`가 더 명시적입니다. batch size는 전역으로 설정해 두면 모든 지연 로딩에 안전망이 됩니다. Spring Data 문서상 `@EntityGraph`는 `attributePaths`로 임시 그래프를 만들거나 `@NamedEntityGraph`를 이름으로 참조할 수 있고, type은 FETCH와 LOAD가 있습니다.
