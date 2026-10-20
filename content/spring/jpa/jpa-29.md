---
slug: "jpa-29"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "`merge`가 `persist`와 다른 점은? `merge` 후 원본 객체는 영속 상태인가요?"
keywords: ["persist는 원본이 영속", "merge는 복사본 반환", "null 덮어쓰기"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
`persist`는 전달한 그 인스턴스를 영속 상태로 만듭니다. `merge`는 준영속 인스턴스의 값을 컨텍스트에 있는(없으면 DB에서 조회한) 영속 엔티티에 복사하고 그 영속 엔티티를 반환하며, 전달한 원본은 계속 준영속입니다. 그래서 `save()`의 반환값을 써야 합니다. 또 merge는 값이 null인 필드도 덮어써서 일부 필드만 가진 객체로 merge하면 데이터가 지워질 수 있습니다. 변경이 필요하면 조회 후 도메인 메서드로 바꾸는 편이 안전합니다. 이 설명은 JPA 명세 기반의 일반 지식입니다(보충). **(공식)** Spring Data가 새 엔티티가 아닌 경우 merge를 호출한다는 점은 공식 문서 내용입니다.
