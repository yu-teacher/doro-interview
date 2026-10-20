---
slug: "jpa-23"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "낙관적 락과 비관적 락의 차이는?"
keywords: ["@Version", "OptimisticLockException", "FOR UPDATE", "PESSIMISTIC_WRITE", "충돌 빈도에 따라 선택", "락 대기·데드락"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
낙관적 락은 충돌이 드물다고 가정하고 `@Version` 컬럼으로 감지합니다. **(공식)** 버전은 처음 저장 시 설정되고 UPDATE마다 증가하며, UPDATE/DELETE의 where 절에 버전을 비교합니다. 일치하는 행이 없으면 `OptimisticLockException`이 발생하고, 이 경우 세션을 버려야 합니다. 비관적 락은 DB 락(`SELECT ... FOR UPDATE` 등)을 실제로 잡습니다. **(공식)** `PESSIMISTIC_WRITE`와 `PESSIMISTIC_READ`는 각각 for update와 for share에 대응하고, 문서는 사용자 상호작용에 걸쳐 비관적 락을 오래 잡지 말라고 권합니다. Spring Data에서는 `@Lock(LockModeType.PESSIMISTIC_WRITE)`를 리포지토리 메서드에 붙입니다(보충, 이번 문서 fetch에서는 세부 확인 못 함). 충돌이 잦은 재고 차감 같은 곳은 비관적 락이, 일반 수정 화면은 낙관적 락이 적합합니다.

```java
@Version
private Long version;   // 래퍼 타입: Spring Data isNew 판단에도 사용된다(null이면 신규)
```
