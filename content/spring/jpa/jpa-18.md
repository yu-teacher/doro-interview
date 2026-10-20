---
slug: "jpa-18"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "연관관계의 주인과 `mappedBy`는 무엇인가요?"
keywords: ["연관관계의 주인", "FK 관리자", "mappedBy", "읽기 전용", "편의 메서드"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
객체에서는 양방향이 참조 두 개지만 DB에는 FK 하나입니다. 그래서 둘 중 FK를 관리하는 쪽을 연관관계의 주인으로 정하고, 이 쪽만 FK를 INSERT/UPDATE에 반영합니다. 주인이 아닌 쪽은 `mappedBy`로 주인의 필드명을 가리키고 읽기 전용입니다. 데모에서는 `Post.member`가 `@JoinColumn(name = "member_id")`를 가진 주인(N쪽)이고, `Member.posts`가 `mappedBy = "member"`인 inverse 쪽입니다. 기준은 보통 FK를 가진 N쪽이 주인입니다. 그래서 `member.getPosts().add(post)`만 하고 `post.setMember`를 빼먹으면 FK가 저장되지 않습니다. 양쪽을 맞추는 연관관계 편의 메서드를 두는 게 안전합니다.

```java
// Post 가 주인: FK(member_id) 는 post.member 값으로만 저장된다
Post post = Post.builder().title("t").member(member).build();
```
