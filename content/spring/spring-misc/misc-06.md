---
slug: "misc-06"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "동시성 문제의 대표 사례를 설명해 주세요. (이메일 중복 체크 후 저장)"
keywords: ["check-then-act", "race condition", "UNIQUE 제약", "DataIntegrityViolationException", "최종 방어선은 DB"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
check-then-act 패턴이 대표적입니다. 데모 프로젝트의 `MemberService.create`는 `existsByEmail`로 중복을 확인하고 `save`로 저장하는데, 두 요청이 거의 동시에 들어오면 둘 다 "없음"을 확인한 뒤 둘 다 insert를 시도합니다. 확인과 저장이 원자적이지 않기 때문에 `@Transactional`을 붙여도 기본 격리 수준에서는 막아 주지 않습니다. 해결은 애플리케이션 `if`가 아니라 DB의 UNIQUE 제약에 맡기는 것입니다. 이메일 컬럼에 유니크 제약을 걸고, insert 시 발생하는 `DataIntegrityViolationException`을 잡아 "이미 사용 중인 이메일"로 변환하는 방식이 가장 단순하고 확실합니다. 사전 `exists` 체크는 친절한 메시지를 위한 빠른 경로로만 남깁니다.

- (실험 확인) 8개 스레드가 같은 이메일로 동시에 가입하면 1명만 성공하고 DB에는 1행만 남았다. 실패 7건은 전부 DB 유니크 제약 위반(`DataIntegrityViolationException`)이었고, 앱의 `existsByEmail` 검사로 던지는 `IllegalArgumentException`은 순차 요청에서만 나타났다. 동시 상황에서는 검사가 둘 다 통과하므로 최종 방어선은 DB 제약이라는 점이 확인된다. 확인 테스트: `experiment/misc/MemberRaceConditionTest`.

데모 코드 (`MemberService.create`):

```java
if (memberRepository.existsByEmail(request.email())) {      // (1) 확인
    throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
}
Member member = Member.builder()...build();
return MemberResponse.from(memberRepository.save(member));   // (2) 저장 - (1)과 (2) 사이에 틈이 있다
```

```java
// 보완 예시 (보충)
try {
    return MemberResponse.from(memberRepository.saveAndFlush(member));
} catch (DataIntegrityViolationException e) {
    throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
}
```

(보충) 이 코드의 위험은 데모의 엔티티에 이메일 유니크 제약이 실제로 걸려 있는지에 달려 있다. 이 문서 작성 시 엔티티 파일은 확인하지 않았으므로, 제약이 없다면 중복 데이터가 그대로 저장된다. 유니크 제약이 있어도 위 코드만으로는 한쪽이 500 에러로 끝날 수 있다.
