---
slug: "jpa-17"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "컬렉션 fetch join과 페이징을 같이 쓰면 왜 위험한가요?"
keywords: ["컬렉션 fetch join + 페이징", "메모리 페이징", "batch size", "2단계 조회", "ToOne만 fetch join"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
concepts: [fetch-strategy, spring-data-jpa]
importance: 2
links: [{to: "jpa-15", kind: PREREQ}, {to: "jpa-16", kind: PREREQ}, {to: "jpa-35", kind: FOLLOWUP}, {to: "dbp-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
1:N 컬렉션을 fetch join하면 부모 행이 자식 수만큼 늘어나서, DB 레벨의 `limit`을 걸면 부모 기준이 아니라 늘어난 행 기준으로 잘립니다. 그래서 Hibernate는 SQL에 limit을 붙이지 않고 조건에 맞는 결과를 모두 가져온 뒤 메모리에서 페이징합니다. 공식 문서는 이를 성능이 매우 나쁠 수 있으니 피하라고 경고합니다. 해결은 ToOne 연관만 fetch join하고 컬렉션은 지연 로딩에 batch size를 두거나, 부모 id를 먼저 페이징 조회한 뒤 IN으로 자식을 가져오는 두 단계 조회입니다(보충).

(공식 문서) Hibernate 사용자 가이드 17.8.4절은 fetch join을 limit이나 페이징 쿼리(`setFirstResult`/`setMaxResults`)에서는 대체로 피하라고 한다. 17.13.1절은 limit과 fetch join을 함께 쓰면 SQL에서 limit 절이 빠지고, Hibernate가 조건에 맞는 결과를 모두 가져와 메모리에서 limit을 적용하며 성능이 매우 나빠질 수 있다고 보여 준다. 부록 A.16.5의 `hibernate.query.fail_on_pagination_over_collection_fetch`는 기본값이 false(예외 없음)이고, true로 켜면 이런 쿼리에서 예외를 던진다. 입문서 8.5절은 batch fetching(`hibernate.default_batch_fetch_size`, `@BatchSize`)이 N+1을 완화하지만 해결하지는 못한다고 설명한다.

(실험 확인) 회원 1명이 게시글 2개를 가진 데이터에서 `select distinct m from Member m join fetch m.posts ... order by m.id`에 `setMaxResults(1)`을 걸면, 반환된 회원은 1명이고 그 회원의 `posts`에는 2개가 모두 담긴다. DB 행 기준으로 limit 1이 적용됐다면 게시글이 1개만 담겼을 것이므로, limit이 DB가 아니라 메모리에서 적용되었음을 보여 준다.

```java
List<Member> page = em.createQuery(
        "select distinct m from Member m join fetch m.posts order by m.id", Member.class)
    .setMaxResults(1)
    .getResultList();
// page.size() == 1, page.get(0).getPosts().size() == 2
```

(보충) ToOne 연관은 행 수를 늘리지 않으므로 fetch join해도 페이징이 안전하다는 점, 그리고 부모 id 먼저 페이징 후 IN 조회하는 두 단계 방식은 문서가 직접 제시한 절차가 아니라 일반적인 대응 방법이다.
