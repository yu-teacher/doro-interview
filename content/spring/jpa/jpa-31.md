---
slug: "jpa-31"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "데모의 `Member`는 `posts`를 `List`로 두었는데 면접에서 설계상 개선점을 말해 보라면?"
keywords: ["단방향으로 충분한가", "cascade 삭제 비용", "컬렉션 fetch join 페이징 금지", "batch size"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
먼저 양방향이 꼭 필요한지 따져 보겠습니다. 게시글 조회는 `PostRepository.findByMemberIdOrderByIdDesc`로도 충분하니 `Member.posts`는 없애도 설계가 단순해질 수 있습니다. 두 번째로 `CascadeType.ALL`과 `orphanRemoval`로 게시글 수가 많은 회원을 지우면 자식을 하나씩 로딩해 삭제하게 되는 비용이 있어서, 대량이면 벌크 삭제나 DB의 ON DELETE를 고려합니다. 세 번째로 `posts`를 fetch join과 페이징에 같이 쓰지 않도록 주의하고, 컬렉션 지연 로딩에는 batch size를 둡니다. 이상은 제 의견이며 요구사항에 따라 달라집니다(보충).
