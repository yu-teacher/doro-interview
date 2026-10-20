---
slug: "jpa-29"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "`merge`가 `persist`와 다른 점은? `merge` 후 원본 객체는 영속 상태인가요?"
keywords: ["persist는 원본이 영속", "merge는 복사본 반환", "null 덮어쓰기"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html", "https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html"]
---
**모범 답변 (30~60초)**
`persist`는 새 엔티티라면 전달한 그 인스턴스를 영속 상태로 만듭니다. `merge`는 준영속 인스턴스의 상태를 같은 식별자의 영속 엔티티(컨텍스트에 없으면 DB에서 새로 조회한 것)에 복사하고 그 영속 엔티티를 반환하며, 전달한 원본은 계속 준영속입니다. 그래서 `save()`의 반환값을 써야 합니다. Spring Data는 새 엔티티면 `persist`, 아니면 `merge`를 호출합니다. merge는 전달 객체의 상태를 복사하므로 값이 null인 필드도 덮어써서, 일부 필드만 가진 객체로 merge하면 기존 값이 지워질 수 있습니다(보충). 변경이 필요하면 영속 엔티티를 조회한 뒤 도메인 메서드로 바꾸는 편이 안전합니다.

(공식 문서) Jakarta Persistence 3.2 사양 3.3.2절은 새 엔티티에 persist를 호출하면 그 엔티티가 관리 상태가 된다고 하고, 준영속 객체에 persist하면 `EntityExistsException`이 날 수 있다고 한다. 3.3.7.1절은 merge가 준영속 X의 상태를 같은 식별자의 기존 관리 인스턴스 X'에 복사하거나 X의 새 관리 복사본 X'를 만든다고 한다. Hibernate 입문서 5.4절 표는 merge가 준영속 객체의 상태를 대응하는 관리 인스턴스로 복사하고 그 영속 객체를 반환한다고 하고, 사용자 가이드 6.12.1절은 데이터를 새 관리 인스턴스로 복사하는 과정이라고 하고, 6.15.2절은 merge 때 현재 상태가 DB에서 방금 조회한 엔티티 버전에 복사되므로 SELECT가 실행된다고 설명한다. Spring Data JPA "Persisting Entities" 절은 `save`가 새 엔티티이면 `persist`, 아니면 `merge`를 호출한다고 한다.
(보충) merge가 null 필드도 그대로 복사해 덮어쓴다는 점은 위 "상태를 복사한다"는 서술로부터의 추론이며, null 처리를 따로 명시한 문장은 확인하지 못했다.

(실험 확인) 새 엔티티에 `save()`를 부르면 추가 SELECT 없이 INSERT 1번이고 같은 인스턴스가 영속 상태가 된다. 준영속 엔티티를 수정해 `save()`하면 SELECT가 먼저 나가고 커밋 시 UPDATE가 실행되며, 반환값은 새 영속 객체이고 원본은 `em.contains`가 false인 준영속 그대로다.

```java
Member detached = findInAnotherTx(id);      // 트랜잭션 종료 후 준영속
detached.update("after");
Member saved = memberRepository.save(detached);   // merge
// saved != detached, em.contains(saved) == true, em.contains(detached) == false
```
