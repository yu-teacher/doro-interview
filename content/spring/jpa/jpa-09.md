---
slug: "jpa-09"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "영속 상태 엔티티에 `save()`를 또 호출해야 하나요?"
keywords: ["영속 엔티티는 save 불필요", "준영속은 merge", "merge는 전체 필드 덮어쓰기"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
트랜잭션 안에서 조회한 엔티티는 이미 영속 상태라서 변경 감지로 UPDATE가 나가므로 `save()`가 필요 없습니다. 호출해도 id가 있으니 merge가 호출되지만, 영속 상태 엔티티에 대한 merge는 사실상 아무 일도 하지 않습니다(보충). 반대로 트랜잭션 밖에서 만들어졌거나 준영속인 엔티티를 변경했다면 save(merge)를 해야 반영됩니다. 다만 merge는 준영속 객체의 모든 필드로 덮어쓰므로 주의해야 합니다. 그래서 보통 "조회 후 변경" 패턴을 권장합니다.
