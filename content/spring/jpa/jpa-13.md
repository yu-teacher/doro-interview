---
slug: "jpa-13"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "LazyInitializationException은 왜 나고 어떻게 해결하나요?"
keywords: ["컨텍스트 종료 후 접근", "트랜잭션 안에서 DTO 변환", "fetch join", "EntityGraph", "Hibernate.initialize"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/"]
concepts: [fetch-strategy, persistence-context]
importance: 3
links: [{to: "jpa-11", kind: PREREQ}, {to: "jpa-12", kind: PREREQ}, {to: "jpa-14", kind: FOLLOWUP}, {to: "jpa-28", kind: FOLLOWUP}, {to: "tx-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
지연 로딩 프록시나 컬렉션은 영속성 컨텍스트가 열려 있을 때만 초기화할 수 있어서, 세션이 끝난 뒤 접근하면 `LazyInitializationException`이 납니다. 해결의 원칙은 컨텍스트를 닫기 전에 필요한 연관을 미리 가져오는 것입니다. 방법으로는 JPQL fetch join, `@EntityGraph` 같은 엔티티 그래프, 필요한 컬럼만 담는 DTO 프로젝션이 있고, 서비스의 트랜잭션 안에서 DTO로 변환해 반환하는 구조를 많이 씁니다. `Hibernate.initialize`로 강제 초기화할 수도 있지만 조회가 추가로 나갑니다. 연관을 EAGER로 바꾸는 것은 근본 해결이 아닙니다. 불필요한 데이터까지 항상 가져오고 N+1이 생길 수 있기 때문입니다.

(공식 문서) 입문서 5.6절은 세션이 끝나 영속성 컨텍스트가 정리되면 프록시를 가져올 수 없고 메서드가 `LazyInitializationException`을 던진다고 하며, 지연 로딩을 일으키는 코드를 피하고 작업 단위 초반에 `join fetch`나 `EntityGraph`로 필요한 데이터를 미리 가져오라고 권한다. 같은 절은 `Hibernate.initialize()`가 편리하지만 DB를 두 번 오가므로 한 번의 쿼리로 가져올 수 있는 데이터에는 비효율적이라고 한다. 사용자 가이드 30.6.1절은 LAZY 연관은 접근 전에 초기화해야 하며 가장 좋은 방법은 영속성 컨텍스트를 닫기 전에 필요한 연관을 모두 가져오는 것이라고 하고, JOIN FETCH는 ToOne 연관과 최대 한 개의 컬렉션에 좋으며 컬렉션이 여럿이면 카테시안 곱을 피하려고 보조 쿼리를 쓰라고 한다. 같은 장은 읽기 전용 작업에는 필요한 컬럼만 고르는 DTO 프로젝션을 가져오라고 하고, EAGER는 거의 항상 나쁜 선택이며 JOIN FETCH를 빼먹으면 보조 select로 N+1이 생길 수 있다고 한다.
(보충) 서비스의 트랜잭션 안에서 엔티티를 DTO로 변환해 반환하는 구조는 문서가 직접 제시한 방법이 아니라 위 원칙(컨텍스트를 닫기 전에 가져오기)을 적용한 일반적 실무 방식이다. 변환 중 지연 로딩으로 접근하면 추가 쿼리가 나가므로 fetch join이나 엔티티 그래프와 함께 쓴다.

(실험 확인) 서비스 메서드가 트랜잭션 안에서 `post.getMember().getName()`을 읽으면 성공하고, 트랜잭션이 없으면 같은 코드가 `LazyInitializationException`이다. 이 실험은 트랜잭션 밖 호출 후 세션이 닫히는 환경(OSIV 없음)에서 실행했다.

```java
@Transactional(readOnly = true)
public String readPost(Long postId) {
    Post post = postRepository.findById(postId).orElseThrow();
    return post.getTitle() + " by " + post.getMember().getName();   // 지연 로딩 성공
}
// @Transactional 이 없는 같은 메서드는 getMember().getName() 에서 LazyInitializationException
```
