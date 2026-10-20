---
slug: "jpa-28"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "EAGER로 바꾸면 LazyInitializationException도 N+1도 해결되지 않나요?"
keywords: ["EAGER는 해결책 아님", "JPQL은 fetch 설정 무시하고 추가 쿼리", "기본 LAZY + 필요 시 명시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
---
**모범 답변 (30~60초)**
둘 다 근본 해결이 아닙니다. EAGER는 연관을 항상 가져오겠다는 정적 선언이라 쿼리별로 바꿀 수 없어서, 필요 없는 조회에서도 데이터를 끌어옵니다. JPQL로 조회할 때 EAGER 연관을 JOIN FETCH에서 빠뜨리면 Hibernate가 연관마다 추가 SELECT를 내보내 N+1이 그대로 생깁니다. Hibernate 입문서는 `@ManyToOne`의 EAGER 기본값이 잘못된 기본값이고 컬렉션 EAGER는 성능이 나쁘다고 말합니다. 그래서 기본은 LAZY로 두고, 필요한 쿼리에서만 fetch join이나 EntityGraph로 명시해 가져옵니다. 지연 로딩 예외도 EAGER로 덮기보다 트랜잭션 안에서 필요한 연관을 미리 가져오는 쪽이 맞습니다.

(공식 문서) Hibernate 사용자 가이드 12.2절은 엔티티 쿼리의 fetch 정책은 덮어쓸 수 없어서 EAGER 연관은 보조 SELECT로 채워지고, JOIN FETCH를 빠뜨린 EAGER 연관마다 보조 select가 나가 N+1이 될 수 있으므로 LAZY를 선호하라고 한다. 12.6절은 JPQL 쿼리에서 EAGER 연관이 빠지면 연관마다 보조 select가 나가고, LAZY 연관을 쿼리별로 eager 하게 가져오는 편이 낫다고 한다. 30.6.1절은 EAGER가 쿼리별로 덮어쓸 수 없어 필요 없어도 항상 가져오며, EAGER 연관을 JOIN FETCH하지 않으면 보조 문장이 N+1을 부를 수 있어 모든 연관을 LAZY로 두라고 한다. 입문서 3.17절은 `@ManyToOne`의 EAGER 기본값을 JPA의 불행한 설계로 꼽고 거의 모든 연관은 LAZY여야 한다고 하며, 3.20절은 컬렉션을 `fetch=EAGER`로 매핑하면 보통 성능이 나빠지고 불필요한 데이터를 가져온다고 한다. 5.6절은 LAZY 프록시가 세션이 끝나면 `LazyInitializationException`을 던지고, 대응 전략으로 연관을 LAZY로 두되 작업 단위 시작에서 join fetch나 EntityGraph로 필요한 데이터를 미리 가져오라고 권한다.

(실험 확인) 작성자 연관이 LAZY인 게시글 6개(작성자 3명)를 JPQL로 조회한 뒤 각 게시글의 작성자 이름에 접근하면 SELECT가 1 + 3번 나간다. 같은 조회를 `join fetch`나 EntityGraph로 하면 SELECT는 1번이다. 리포지토리에 `@EntityGraph(attributePaths = "member")`를 붙인 목록 메서드는 작성자가 이미 초기화되어 반환되고, 같은 연관을 일반 `findById`로 조회하면 LAZY 프록시로 남는다.

```java
@EntityGraph(attributePaths = "member")
List<Post> findByMemberIdOrderByIdDesc(Long memberId);   // 이 메서드에서만 작성자를 함께 로딩
```
