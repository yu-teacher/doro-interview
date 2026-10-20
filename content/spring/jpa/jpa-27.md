---
slug: "jpa-27"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "`findById`와 `getReferenceById`(구 `getOne`)는 어떻게 다른가요?"
keywords: ["find vs getReference", "프록시", "쿼리 절약", "예외 지연"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
`findById`는 즉시 쿼리를 날려 실제 엔티티를 `Optional`로 줍니다. `getReferenceById`는 `EntityManager.getReference`에 대응해 쿼리 없이 프록시를 돌려주고, 필드에 처음 접근할 때 로딩하며, 없는 id면 그때 예외가 납니다. **(공식)** Hibernate 입문서는 프록시의 id 접근과 `getReference()`로 연관 설정을 만드는 것이 조회를 일으키지 않는다고 설명합니다. 데모에서 게시글을 쓸 때 작성자의 존재 확인이 필요 없고 FK만 필요하다면 `getReferenceById`로 SELECT 한 번을 아낄 수 있습니다. Spring Data 메서드 이름 부분은 보충 설명입니다.
