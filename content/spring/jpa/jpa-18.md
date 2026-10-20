---
slug: "jpa-18"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "연관관계의 주인과 `mappedBy`는 무엇인가요?"
keywords: ["연관관계의 주인", "FK 관리자", "mappedBy", "읽기 전용", "편의 메서드"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
---
**모범 답변 (30~60초)**
객체에서는 양방향이 참조 두 개지만 DB에는 FK 하나입니다. 그래서 둘 중 한쪽을 연관관계의 주인으로 정하고, 공식 문서에 따르면 DB 반영은 주인 쪽이 가진 참조를 기준으로 합니다. 주인이 아닌 쪽은 `mappedBy`로 주인의 필드명을 가리키며, 그쪽만 바꾸면 DB에 반영되지 않으므로 사실상 읽기 전용입니다. 1:N 양방향에서는 N쪽이 반드시 주인이고, 일대일에서는 FK를 가진 쪽이 주인입니다. 그래서 `member.getPosts().add(post)`만 하고 `post.setMember(member)`를 빼먹으면 FK가 저장되지 않습니다. 양쪽 참조를 일관되게 맞추는 것은 개발자 책임이고, 이를 돕는 연관관계 편의 메서드를 두는 게 안전합니다(보충).

```java
@Entity
class Post {
    @Id @GeneratedValue Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    Member member;                 // 주인: FK(member_id)는 이 필드 값으로 저장된다
}

@Entity
class Member {
    @Id @GeneratedValue Long id;

    @OneToMany(mappedBy = "member")
    List<Post> posts = new ArrayList<>();   // 주인이 아닌 쪽
}
```

(공식 문서) Jakarta Persistence 3.2 사양 2.11절은 양방향 관계에 주인 쪽과 반대(inverse) 쪽이 있고, 주인 쪽이 DB 갱신을 결정하며, 반대쪽은 `mappedBy`로 주인을 가리켜야 한다고 한다. 1:N 양방향에서 many 쪽이 주인이어야 하고(그래서 `@ManyToOne`에는 `mappedBy`를 쓸 수 없다), 일대일 양방향에서는 FK를 가진 쪽이 주인이라고 한다. 3.3.4절은 양방향 관계가 주인 쪽 참조를 기준으로 영속화되고, 주인 쪽과 반대쪽의 메모리 참조를 일관되게 유지하는 것은 개발자 책임이며 반대쪽 변경이 주인 쪽에 반영되지 않으면 변경이 유실될 수 있다고 말한다. Hibernate 입문서 3.17절도 양방향 연관을 바꾸려면 주인 쪽을 바꿔야 하고 반대쪽 변경은 DB에 동기화되지 않는다고 설명한다.
(보충) 편의 메서드라는 이름과 그것이 안전하다는 권고는 문서가 아니라 실무 관행이다.
