---
slug: "jpa-17"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "컬렉션 fetch join과 페이징을 같이 쓰면 왜 위험한가요?"
keywords: ["컬렉션 fetch join + 페이징", "메모리 페이징", "batch size", "2단계 조회", "ToOne만 fetch join"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
1:N 컬렉션을 조인하면 부모 행이 자식 수만큼 늘어나서, DB 레벨의 `limit`을 걸면 부모 기준이 아니라 늘어난 행 기준으로 잘립니다. 그래서 Hibernate는 DB 페이징을 포기하고 전체를 메모리로 올린 뒤 메모리에서 페이징하는데, 이때 경고를 남기며 데이터가 많으면 OOM 위험이 있습니다. 이 동작과 경고는 널리 알려져 있으나 이번에 문서로 직접 확인하지는 못했습니다(보충). 해결은 ToOne만 fetch join하고 컬렉션은 지연 로딩에 batch size를 두거나, 부모 id를 먼저 페이징 조회한 뒤 IN으로 자식을 가져오는 두 단계 조회입니다. 예컨대 데모의 `Member.posts`를 fetch join하며 `Pageable`을 쓰는 건 피해야 합니다.
