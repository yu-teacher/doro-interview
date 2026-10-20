---
slug: "jpa-11"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "지연 로딩과 즉시 로딩, 그리고 기본 fetch 전략은?"
keywords: ["ManyToOne 기본 EAGER", "OneToMany 기본 LAZY", "모두 LAZY로", "필요 시 fetch join"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
---
**모범 답변 (30~60초)**
즉시 로딩은 엔티티를 조회할 때 연관 엔티티도 함께 가져오고, 지연 로딩은 실제로 접근할 때 가져옵니다. 기본값은 `@ManyToOne`과 `@OneToOne`이 EAGER, `@OneToMany`와 `@ManyToMany`는 LAZY입니다. Hibernate 입문서는 `@ManyToOne`의 EAGER 기본값을 JPA의 불행한 설계라고 부르며, 거의 모든 연관을 LAZY로 두고 `fetch = LAZY`를 명시하라고 권합니다. 사용자 가이드는 EAGER 연관을 JPQL에서 JOIN FETCH하지 않으면 연관마다 추가 select가 나가 N+1이 생길 수 있다고 경고합니다. 그래서 연관은 LAZY로 두고, 필요한 작업에서만 fetch join이나 엔티티 그래프로 미리 가져오는 방식을 입문서가 권합니다.

(공식 문서) Jakarta Persistence 3.2 사양의 어노테이션 정의에서 `@ManyToOne`·`@OneToOne`의 `fetch` 기본값은 `EAGER`, `@OneToMany`·`@ManyToMany`는 `LAZY`다. 사양은 LAZY가 구현체에 대한 힌트라고 명시한다. 입문서 3.16절 표도 같은 기본값을 싣고, 3.17절은 `@ManyToOne`이 기본으로 즉시 가져와지는 것을 JPA의 불행한 결함이라 하고 거의 모든 연관이 LAZY여야 한다고 한다. 컬렉션을 `fetch=EAGER`로 매핑하면 보통 성능이 나빠지고 불필요한 데이터를 가져오게 되며 `@ManyToMany(fetch=EAGER)`는 쓰지 말라고 한다. 5.6절은 모든 연관을 `fetch=LAZY`로 하고 작업 단위 초반에 `join fetch`나 `EntityGraph`로 필요한 데이터를 미리 가져오라고 권한다. 사용자 가이드 12.2절과 30.6.1절은 EAGER 연관을 JOIN FETCH하지 않으면 추가 select가 나가 N+1 문제가 될 수 있으므로 LAZY 연관을 쓰라고 한다.

```java
@ManyToOne(fetch = FetchType.LAZY)   // @ManyToOne 은 기본이 EAGER 이므로 명시한다
private Member member;
```
