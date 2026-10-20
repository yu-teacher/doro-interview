---
slug: "jpa-06"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "변경 감지(dirty checking)는 어떻게 동작하나요? 데모에서는 어떻게 확인했나요?"
keywords: ["스냅샷 비교", "flush 시 UPDATE", "save 불필요", "도메인 메서드", "데모 실험 1"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
엔티티를 영속 상태로 로딩하면 Hibernate가 로딩 시점의 스냅샷을 보관합니다. flush 때 현재 상태와 스냅샷을 비교해서 달라진 필드가 있으면 UPDATE를 만듭니다. 그래서 영속 상태 엔티티는 setter로 값만 바꿔도 `save()` 호출 없이 UPDATE가 나갑니다. 데모의 `TxExperimentTest.더티체킹_save_후_값을_바꾸면_UPDATE가_나간다`가 save 후 값을 바꿨을 때 DB에 "second"가 반영되는 걸 검증합니다. 참고로 `Member.update(name)` 같은 도메인 메서드로 값을 바꾸는 설계가 이 동작과 잘 맞습니다. **(공식)** 입문서도 영속 엔티티의 변경은 flush 때 자동 감지되어 반영된다고 설명합니다.

```java
@Transactional
public void rename(Long id, String name) {
    Member m = memberRepository.findById(id).orElseThrow();
    m.update(name);   // save() 없이도 커밋 시 UPDATE
}
```
