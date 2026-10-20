---
slug: "jpa-13"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "LazyInitializationException은 왜 나고 어떻게 해결하나요?"
keywords: ["컨텍스트 종료 후 접근", "트랜잭션 안에서 DTO 변환", "fetch join", "EntityGraph", "데모 실험 6·7"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
프록시는 영속성 컨텍스트가 열려 있을 때만 초기화됩니다. **(공식)** 컨텍스트가 닫힌 뒤 접근하면 LazyInitializationException이 발생합니다. 데모의 `TxExperimentTest`가 정확히 이를 재현합니다. `트랜잭션_안에서는_지연로딩이_된다`는 성공하고, `트랜잭션_밖에서는_지연로딩이_실패한다`는 예외를 검증합니다. 해결은 필요한 데이터를 트랜잭션 안에서 미리 조회하는 것입니다. fetch join, `@EntityGraph`, 서비스에서 DTO로 변환해 반환하는 방식이 있습니다. `Hibernate.initialize`로 강제 초기화하는 방법도 있지만 추가 쿼리가 나갑니다. 연관을 EAGER로 바꾸는 건 근본 해결이 아닙니다.

```java
// 데모: 서비스 메서드가 @Transactional 이면 post.getMember().getName() 가능
// 트랜잭션이 없으면 같은 코드가 LazyInitializationException
```
