---
slug: "jpa-06"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "변경 감지(dirty checking)는 어떻게 동작하나요?"
keywords: ["스냅샷 비교", "flush 시 UPDATE", "save 불필요", "도메인 메서드", "바이트코드 향상"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
Hibernate는 바이트코드 향상을 쓰지 않으면 DB에서 읽거나 DB에 쓴 뒤의 엔티티 상태를 스냅샷으로 보관합니다. flush 때 현재 상태를 스냅샷과 비교해서 달라진 엔티티가 있으면 UPDATE를 만듭니다. 그래서 영속 상태 엔티티는 setter나 도메인 메서드로 값만 바꿔도 `save()` 호출 없이 커밋 때 UPDATE가 나갑니다. 입문서도 영속 엔티티의 변경은 flush 때 자동으로 감지되어 DB에 반영된다고 설명합니다. 바이트코드 향상을 켜면 필드 쓰기를 가로채 변경을 기록하므로 스냅샷 비교 비용을 줄일 수 있지만, 정확도가 조금 떨어질 수 있다는 단서가 붙습니다. 준영속이나 비영속 엔티티는 컨텍스트가 관리하지 않으므로 이 동작이 적용되지 않습니다.

(공식 문서) 입문서 5.1절은 컨텍스트 덕분에 엔티티를 수정한 뒤 변경을 전파하라는 명시적 연산을 호출할 필요가 없고 변경이 flush 때 동기화된다고 설명한다. 9.12절은 바이트코드 향상기를 쓰지 않으면 Hibernate가 읽거나 쓴 뒤 엔티티 상태의 스냅샷을 보관하고 flush 때 현재 상태와 비교하며, 향상기를 쓰면 필드 쓰기를 가로채 변경을 기록하지만 이 방식은 스냅샷 방식보다 덜 정확할 수 있다고 한다. 사양 3.3.4절은 영속 엔티티의 상태가 커밋 때 DB에 동기화되며, 영속 속성에 새 값을 대입하는 것뿐 아니라 가변 값을 수정하는 것도 갱신에 포함한다고 한다. 3.3.7절은 준영속 엔티티의 상태는 더 이상 DB와 동기화가 보장되지 않는다고 한다.
(보충) `Member.update(name)` 같은 도메인 메서드로 값을 바꾸는 설계가 이 동작과 잘 맞는다는 것은 문서의 권고가 아니라 설계 판단이다.

(실험 확인) 트랜잭션 안에서 새 엔티티를 `save`한 뒤 필드를 바꾸면, 별도의 `save`나 `flush` 호출 없이 커밋 시 변경된 값이 DB에 반영된다.

```java
@Transactional
public Long dirtyChecking(String email) {
    Member saved = memberRepository.save(Member.builder().name("first").email(email).build());
    saved.update("second");   // 추가 save 없음
    return saved.getId();     // 커밋 후 DB 조회 결과: name = "second"
}
```
