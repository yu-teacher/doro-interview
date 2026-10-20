---
slug: "jpa-09"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "영속 상태 엔티티에 `save()`를 또 호출해야 하나요?"
keywords: ["영속 엔티티는 save 불필요", "준영속은 merge", "merge는 전체 필드 덮어쓰기"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html", "https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
트랜잭션 안에서 조회한 엔티티는 이미 영속 상태라서 변경 감지로 flush 때 UPDATE가 나가므로 `save()`가 필요 없습니다. 호출해도 id가 있어 새 엔티티가 아니므로 merge가 호출되지만, 사양상 영속 상태 엔티티에 대한 merge는 무시됩니다. 반대로 트랜잭션 밖에서 만들어졌거나 준영속인 엔티티를 바꿨다면 `save()`(merge)를 해야 반영되는데, merge는 준영속 객체의 상태를 관리 중인 인스턴스에 복사하는 것이라 해당 객체가 가진 값으로 덮어쓰게 됩니다. 그래서 조회 후 변경하는 패턴을 선호합니다.

(공식 문서) 사양 3.3.7.1절은 merge의 규칙을 정의한다. 준영속 엔티티면 상태를 같은 식별자의 기존 관리 인스턴스에 복사하거나 새 관리 복사본을 만들고, 관리 상태 엔티티면 merge는 무시된다(연관에 `cascade=MERGE`가 있으면 그쪽으로만 전파된다). Spring Data JPA 문서 Persisting Entities 절은 새 엔티티가 아니면(식별자가 non-null이면) `merge`를 호출한다고 한다. 입문서 5.1절은 영속 엔티티를 수정하면 변경을 전파하는 명시적 연산이 필요 없다고 설명한다.
(보충) 조회 후 변경 패턴을 권한다는 것은 설계 판단이다. 사양은 merge가 준영속 인스턴스의 상태를 복사한다고만 하며, 값이 null인 필드까지 덮어쓰는지 같은 세부는 이 답변에서 다루지 않는다.

(실험 확인) 준영속 엔티티를 바꾼 뒤 새 트랜잭션에서 `save()`하면 SELECT 후 UPDATE가 나가 DB에 반영되고, 반환값은 영속 상태이지만 원본 객체는 준영속 그대로다.
