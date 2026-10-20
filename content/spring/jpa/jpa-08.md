---
slug: "jpa-08"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "Spring Data JPA의 `save()`는 persist인가요 merge인가요?"
keywords: ["SimpleJpaRepository.save", "isNew 판단", "@Version null", "id null", "Persistable", "merge는 복사본 반환"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
둘 다이고, 엔티티가 새것인지에 따라 갈립니다. **(공식)** 새 엔티티면 `EntityManager.persist`, 아니면 `merge`를 호출합니다. 새것인지 판단하는 기본 규칙은 두 가지로, 래퍼 타입 `@Version` 필드가 있으면 그 값이 null일 때 새것이고, 없으면 id가 null일 때 새것입니다. 그래서 id를 직접 할당하는 엔티티는 id가 null이 아니므로 merge가 호출되고, 불필요한 SELECT 후 INSERT가 됩니다. 이럴 땐 `Persistable`을 구현해 `isNew()`를 직접 제어하는 걸 공식 문서가 안내합니다. 데모처럼 IDENTITY로 id를 생성하면 새 엔티티의 id는 null이라 persist가 호출됩니다.

```java
// merge는 "전달한 객체"가 아니라 "반환된 객체"가 영속 상태다
Member saved = memberRepository.save(member);   // 항상 반환값을 쓰자
```
