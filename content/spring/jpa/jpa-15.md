---
slug: "jpa-15"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "N+1 문제란 무엇이고 어떻게 해결하나요?"
keywords: ["N+1", "fetch join", "@EntityGraph", "batch size", "subselect", "EAGER는 해결책 아님"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
목록 쿼리 한 번으로 N개를 가져온 뒤, 각 행의 연관 엔티티를 접근할 때마다 쿼리가 한 번씩 추가로 나가 총 N+1번이 되는 문제입니다. **(공식)** Hibernate 입문서는 이를 데이터 접근 성능 저하의 가장 흔한 원인으로 설명합니다. 해결책 세 가지가 있습니다. 첫째, JOIN으로 한 번에 가져오는 fetch join 또는 `@EntityGraph`로, 문서도 "가장 올바른 해법은 조인"이라는 취지로 말합니다. 둘째, batch fetching으로 `hibernate.default_batch_fetch_size`나 `@BatchSize`를 쓰면 IN 절로 묶어 쿼리 수를 N에서 N/배치크기로 줄입니다. 셋째, subselect fetching입니다. 데모의 `PostRepository`는 `findAllByOrderByIdDesc`에 `@EntityGraph(attributePaths = "member")`를 붙여, 목록 조회 시 작성자를 한 번에 조인해서 N+1을 막습니다.

```java
@EntityGraph(attributePaths = "member")
List<Post> findAllByOrderByIdDesc();     // post + member 를 한 쿼리로

// application.yml (보충): spring.jpa.properties.hibernate.default_batch_fetch_size: 100
```
