---
slug: "jpa-31"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "양방향 1:N 컬렉션(예: `Member.posts`)을 `List`로 둔 설계에서 개선점을 말해 보라면?"
keywords: ["단방향으로 충분한가", "cascade 삭제 비용", "컬렉션 fetch join 페이징 금지", "batch size"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
concepts: [entity-mapping, fetch-strategy]
importance: 1
links: [{to: "jpa-17", kind: PREREQ}, {to: "jpa-18", kind: PREREQ}, {to: "jpa-19", kind: PREREQ}]
---
**모범 답변 (30~60초)**
먼저 양방향이 꼭 필요한지 따져 보겠습니다. 게시글 조회는 게시글 리포지토리에서 회원 id 조건으로도 충분하다면 `Member.posts`를 없애 설계를 단순하게 할 수 있습니다(제 의견이며 요구사항에 따라 다릅니다). 두 번째로 `CascadeType.ALL`과 `orphanRemoval`로 게시글이 많은 회원을 지우면 자식을 하나씩 DELETE하게 되고 JDBC 배치도 방해받으므로, 대량이면 벌크 삭제나 DB의 `ON DELETE CASCADE`(`@OnDelete`)를 고려합니다. 세 번째로 컬렉션을 fetch join과 페이징에 같이 쓰면 메모리 페이징이 되니 피하고, 컬렉션 지연 로딩에는 batch size를 둡니다(보충).

(공식 문서) Hibernate 입문서 3.17절은 대부분의 경우 연관을 양방향으로 탐색하고 싶어 하며 연관 정보를 Hibernate가 알아야 N+1 같은 문제를 최적화할 수 있다고 서술하고, 양방향 연관을 바꾸려면 주인 쪽을 바꿔야 한다고 한다. Jakarta Persistence 3.2 사양 3.3.4절은 양방향 관계에서 두 쪽의 메모리 참조를 일관되게 유지할 책임이 개발자에게 있다고 한다. Hibernate 사용자 가이드 6.15.3절은 `CascadeType.REMOVE`에서 부모를 지우면 자식 DELETE 문이 따로 실행되는 예를 보여 주고, 6.15.8절은 `@OnDelete(action = CASCADE)`가 DDL 수준 외래 키 기능이라 부모만 DELETE하면 자식 행은 DB 엔진이 지운다고 한다. 30.3절은 DELETE 문의 부모·자식 순서를 정렬하는 옵션이 없어 cascade가 JDBC 배치를 방해할 수 있다고 한다. 같은 문서의 17.8.4절과 17.13.1절은 컬렉션 fetch join에 limit·페이징을 같이 쓰면 메모리에서 limit이 적용된다고 한다(jpa-17 참고). 입문서 8.5절은 batch fetching이 N+1을 완화하지만 해결은 못한다고 한다.

(실험 확인) `Member`에 `cascade = ALL, orphanRemoval = true`로 `posts`를 매핑하고 게시글이 2개인 회원을 삭제하면 회원과 게시글이 모두 삭제되며 Hibernate 통계상 삭제된 엔티티 수는 3(회원 1 + 게시글 2)이다. 자식이 많을수록 엔티티 단위 삭제가 늘어난다.

```java
@OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Post> posts = new ArrayList<>();
```

(보충) `Member.posts`를 없애는 것이 낫다는 판단, 그리고 batch size 설정을 컬렉션 지연 로딩에 두는 구체적 권고는 설계 의견이며 요구사항에 따라 달라진다.
