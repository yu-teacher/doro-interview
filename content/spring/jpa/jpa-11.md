---
slug: "jpa-11"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "지연 로딩과 즉시 로딩, 그리고 기본 fetch 전략은?"
keywords: ["ManyToOne 기본 EAGER", "OneToMany 기본 LAZY", "모두 LAZY로", "필요 시 fetch join"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
즉시 로딩은 엔티티를 조회할 때 연관 엔티티도 함께 가져오고, 지연 로딩은 실제로 접근할 때 가져옵니다. **(공식)** Hibernate 입문서에 따르면 `@ManyToOne`의 기본은 EAGER, `@OneToMany`와 `@ManyToMany`는 LAZY이고, 문서는 EAGER 기본값을 좋지 않은 기본값이라 하며 연관은 기본 LAZY로 두라고 권합니다. 데모의 `Post.member`도 `FetchType.LAZY`로 명시했습니다. 즉시 로딩은 JPQL에서 예측하지 못한 추가 쿼리(N+1)를 만들기 쉽기 때문에, 필요한 곳에서 fetch join이나 `@EntityGraph`로 끌어오는 방식이 실무 표준입니다.
