---
slug: "misc-06"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "동시성 문제의 대표 사례를 설명해 주세요. (이메일 중복 체크 후 저장)"
keywords: ["check-then-act", "race condition", "UNIQUE 제약", "DataIntegrityViolationException", "최종 방어선은 DB"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/dao/DataIntegrityViolationException.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Isolation.html", "https://docs.spring.io/spring-framework/reference/data-access/dao.html"]
---
**모범 답변 (30~60초)**
check-then-act 패턴이 대표적입니다. 가입 메서드가 `existsByEmail`로 이메일 중복을 확인하고 `save`로 저장한다면, 두 요청이 거의 동시에 들어올 때 둘 다 "없음"을 확인한 뒤 둘 다 insert를 시도합니다. 확인과 저장이 원자적이지 않아서 `@Transactional`을 붙이고 기본 격리 수준을 써도 막히지 않을 수 있습니다. 해결은 애플리케이션의 `if`가 아니라 DB의 UNIQUE 제약에 맡기는 것입니다. 이메일 컬럼에 유니크 제약을 걸고, 위반 시 던져지는 `DataIntegrityViolationException`을 잡아 "이미 사용 중인 이메일"로 변환하는 방식이 가장 단순하고 확실합니다. 사전 `exists` 체크는 친절한 메시지를 위한 빠른 경로로만 남깁니다.

```java
@Transactional
public MemberResponse create(MemberRequest request) {
    if (memberRepository.existsByEmail(request.email())) {      // (1) 확인
        throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
    }
    return MemberResponse.from(memberRepository.save(member)); // (2) 저장 - (1)과 (2) 사이에 틈이 있다
}
```

```java
// 보완 예시: DB 제약 위반을 업무 예외로 변환한다
try {
    return MemberResponse.from(memberRepository.saveAndFlush(member));
} catch (DataIntegrityViolationException e) {
    throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
}
```

(실험 확인) 이메일 컬럼에 `unique = true`가 걸린 JPA 엔티티와 위 구조의 `@Transactional` 가입 메서드를 MySQL에 연결해(기본 격리 수준, Boot 4.1.1) 실험했다. 8개 스레드가 같은 이메일로 동시에 가입하면 1명만 성공하고 DB에는 1행만 남았다. 실패 7건은 전부 DB 유니크 제약 위반인 `DataIntegrityViolationException`이었고, 앱의 `existsByEmail` 검사가 던지는 `IllegalArgumentException`은 순차 요청에서만 나타났다. 즉 이 실행에서는 동시 요청이 모두 중복 검사를 통과했다. 어느 요청이 성공하는지와 실패 건수의 분포는 실행마다 달라질 수 있으며, 위 결과는 이 구성에서 관찰한 것이다.

(공식 문서) `DataIntegrityViolationException`의 Javadoc은 이 예외를, insert나 update 같은 SQL 실행이 무결성 제약 위반으로 실패할 때 던져지는 예외라고 설명하고, 기본 키 같은 유일성 제약이 대부분의 DB에서 필요하다고 한다. 하위 예외 `DuplicateKeyException`도 있지만 하위 클래스에 의존하기보다 `DataIntegrityViolationException` 자체를 처리하라고 권한다. `Isolation.DEFAULT`는 기반 데이터 저장소의 기본 격리 수준을 쓰는 것이라고 설명하며, 격리 수준에 따라 막히는 현상이 다르므로 위 "막히지 않을 수 있다"는 말은 DB와 격리 수준에 의존한다.

(보충) 이 문서의 코드 위험은 이메일 유니크 제약이 실제로 걸려 있는지에 달려 있다. 제약이 없으면 중복 데이터가 그대로 저장되고, 제약이 있어도 위 예외를 변환하지 않으면 한쪽 요청은 500 에러로 끝날 수 있다. JPA에서는 insert가 flush 시점에 나갈 수도 있어서, 보완 예시는 예외가 메서드 안에서 나도록 `saveAndFlush`를 썼다. 이 부분은 일반 지식이다.
