---
slug: "jpa-28"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "EAGER로 바꾸면 LazyInitializationException도 N+1도 해결되지 않나요?"
keywords: ["EAGER는 해결책 아님", "JPQL은 fetch 설정 무시하고 추가 쿼리", "기본 LAZY + 필요 시 명시"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
둘 다 근본 해결이 아닙니다. EAGER는 항상 연관을 가져오겠다는 선언이라 필요 없는 조회에서도 데이터를 끌어오고, JPQL로 조회하면 JPQL이 연관까지 알아서 조인해 주지 않아서 결국 엔티티 로딩 후 연관마다 추가 SELECT가 나가는 N+1이 그대로 생깁니다. **(공식)** 입문서는 `@ManyToOne` EAGER 기본값이 나쁜 기본값이고 컬렉션 EAGER는 특히 성능이 나쁘다고 말합니다. 그래서 기본은 LAZY로 두고 쓰임새별로 fetch join이나 EntityGraph로 명시해서 가져옵니다. 데모의 `Post.member`가 LAZY인데 `PostRepository` 목록 메서드에만 `@EntityGraph`를 붙인 이유가 이것입니다.
