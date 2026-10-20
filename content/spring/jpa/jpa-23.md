---
slug: "jpa-23"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "낙관적 락과 비관적 락의 차이는?"
keywords: ["@Version", "OptimisticLockException", "FOR UPDATE", "PESSIMISTIC_WRITE", "충돌 빈도에 따라 선택", "락 대기·데드락"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html", "https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html", "https://docs.spring.io/spring-data/jpa/reference/jpa/entity-persistence.html"]
---
**모범 답변 (30~60초)**
낙관적 락은 충돌이 드물다고 가정하고 데이터를 잠그지 않은 채 진행하며 `@Version` 컬럼으로 충돌을 감지합니다. 버전은 영속화될 때 부여되고 UPDATE마다 증가하며, UPDATE/DELETE의 where 절에서 버전을 비교합니다. 갱신된 행이 없으면 `OptimisticLockException`이 나고, 이 경우 세션을 버려야 합니다. 비관적 락은 충돌이 날 것이라 가정하고 DB 락을 실제로 잡습니다. `PESSIMISTIC_WRITE`는 for update, `PESSIMISTIC_READ`는 for share 락에 해당하고, 사용자 상호작용에 걸쳐 오래 잡지 말라고 권하며 경합은 대기·데드락을 부릅니다. Spring Data에서는 리포지토리 메서드에 `@Lock`을 붙입니다. 충돌이 잦은 재고 차감은 비관적 락이, 일반 수정 화면은 낙관적 락이 어울립니다(보충).

```java
@Version
private Long version;   // 래퍼 타입: Spring Data isNew 판단에도 사용된다(null이면 신규)
```

(공식 문서) Hibernate 입문서 3.8절은 version 속성이 엔티티가 영속화될 때 Hibernate가 부여하고 수정될 때마다 증가한다고 한다(숫자형이면 기본 0에서 시작). 5.4절은 버전 검사가 버전 엔티티의 모든 SQL update/delete where 절에 포함되고, 갱신된 행이 없으면 `OptimisticLockException`을 던지며, 이때 Hibernate 세션은 폐기해야 한다고 한다. 8.16절은 동시성 접근이 `@Version` 낙관적 락과 DB 수준 비관적 락(SQL for update)의 둘이고, 락 경합이 있으면 lock escalation, 데드락, 락 획득 타임아웃이 생길 수 있으며, 멀티유저 시스템에서는 사용자 상호작용에 걸쳐 비관적 락을 잡지 말라고 하고 낙관적 락이 일반적이라 한다. 같은 절의 표는 `PESSIMISTIC_READ`를 for share, `PESSIMISTIC_WRITE`를 for update 락으로 설명한다. 사용자 가이드 11장은 낙관적 락이 충돌이 서로 영향을 주지 않을 것이라 가정해 데이터를 잠그지 않는다고 설명한다. Jakarta Persistence 3.2 사양 3.5.2절은 버전이 일치하지 않으면 `OptimisticLockException`을 던져야 한다고 한다. Spring Data JPA 문서의 Locking 절은 쿼리 메서드나 재선언한 CRUD 메서드에 `@Lock`으로 락 모드를 지정한다고 한다. Persisting Entities 절은 non-primitive 버전 속성이 있으면 그 값이 null일 때 새 엔티티로 판단하고, JPA는 0을 첫 버전으로 보므로 primitive 버전 속성으로는 신규 여부를 판단할 수 없다고 한다.
(보충) 재고 차감과 일반 수정 화면이라는 적용 예는 일반적인 경험칙이다.
