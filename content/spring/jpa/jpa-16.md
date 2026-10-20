---
slug: "jpa-16"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "fetch join, `@EntityGraph`, batch size는 어떻게 선택하나요?"
keywords: ["ToOne은 fetch join", "컬렉션은 batch size", "카테시안 곱", "EntityGraph type FETCH/LOAD"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html"]
---
**모범 답변 (30~60초)**
Hibernate 문서는 외부 조인 fetching이 보통 가장 효율적이라고 합니다. 다만 컬렉션 두 개를 한 쿼리에서 함께 조인하면 카테시안 곱으로 결과가 커져서, 하나는 조인하고 나머지는 subselect 같은 후속 쿼리로 가져오라고 권합니다. 그래서 저는 ToOne 연관은 fetch join이나 `@EntityGraph`로 가져오고, 컬렉션은 batch size로 보완하는 구성을 기본으로 삼습니다. `@EntityGraph`는 Spring Data 쿼리 메서드에 붙이기만 하면 되어 간편하고, 복잡한 조건은 `@Query`의 `join fetch`가 더 명시적입니다. Spring Data 문서상 `@EntityGraph`는 `attributePaths`로 임시 그래프를 만들거나 `@NamedEntityGraph`를 이름으로 참조할 수 있고, type은 FETCH와 LOAD가 있습니다.

(공식 문서) 입문서 8.6절은 외부 조인 fetching이 보통 연관을 가져오는 가장 좋은 방법이고 batch나 subselect fetching보다 효율적이라고 하며, 컬렉션 두 개를 병렬로 가져올 때 둘 다 조인하면 테이블의 카테시안 곱과 큰 결과가 되므로, 하나는 조인으로 가져오고 나머지는 subselect fetching으로 가져오는 것이 도움이 된다고 한다. 사용자 가이드 30.6.1절은 JOIN FETCH가 ToOne 연관과 최대 한 개의 컬렉션에 좋고, 컬렉션이 여럿이면 카테시안 곱을 피하려고 LAZY 연관 탐색이나 `Hibernate#initialize`로 일으키는 보조 쿼리를 쓰라고 한다. 입문서 8.5절은 batch·subselect fetching이 기본으로 꺼져 있으며 `hibernate.default_batch_fetch_size`나 `@BatchSize` 등으로 켠다고 한다. 입문서 5.7절은 엔티티 그래프를 fetch graph(그래프에 있는 연관만 즉시 로딩)와 load graph(매핑이 EAGER인 연관에 더해 그래프의 연관도 가져옴)로 해석한다고 하며, `find()`에 직접 넘기면 load graph다. Spring Data JPA 문서는 `@EntityGraph`가 `@NamedEntityGraph`를 이름으로 참조하며 `type` 속성으로 Fetch나 Load를 지정할 수 있고(예시는 `EntityGraphType.LOAD`), `attributePaths`로 `@NamedEntityGraph` 없이 임시 그래프를 정의할 수 있다고 한다.
(보충) ToOne은 fetch join이나 엔티티 그래프, 컬렉션은 batch size라는 기본 구성은 위 권고를 바탕으로 한 제 선택이고 문서가 그대로 제시한 규칙은 아니다. 전역 batch size가 모든 지연 로딩의 안전망이 된다는 표현과, 복잡한 조건에서는 `@Query`의 `join fetch`가 더 명시적이라는 판단도 문서에 없는 설계 의견이다.
