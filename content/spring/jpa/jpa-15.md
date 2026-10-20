---
slug: "jpa-15"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "N+1 문제란 무엇이고 어떻게 해결하나요?"
keywords: ["N+1", "fetch join", "@EntityGraph", "batch size", "subselect", "EAGER는 해결책 아님"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
concepts: [fetch-strategy]
importance: 3
links: [{to: "jpa-11", kind: PREREQ}, {to: "jpa-16", kind: FOLLOWUP}, {to: "jpa-17", kind: FOLLOWUP}, {to: "jpa-28", kind: FOLLOWUP}, {to: "dbp-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
목록 쿼리 한 번으로 N개 행을 가져온 뒤, 각 행의 연관 엔티티를 접근할 때마다 쿼리가 한 번씩 추가로 나가 총 N+1번이 되는 문제입니다. Hibernate 입문서는 이를 성능 저하의 가장 흔한 원인이라고 설명합니다. 해결책은 세 가지입니다. 첫째, 조인으로 한 번에 가져오는 fetch join이나 `@EntityGraph`로, 입문서는 조인이 가장 올바른 해법이라고 합니다. 둘째, batch fetching으로 `hibernate.default_batch_fetch_size`나 `@BatchSize`를 쓰면 여러 키를 묶어 조회해 쿼리 수를 줄입니다. 셋째, 서브쿼리로 한 번에 가져오는 subselect fetching입니다. 연관을 EAGER로 바꾸는 것은 해결책이 아니고, EAGER 연관에서 JOIN FETCH를 빼먹으면 오히려 추가 select로 N+1이 생깁니다.

(공식 문서) 입문서 8.4절은 N+1을 N개 행을 가져오는 첫 쿼리 뒤에 연관 인스턴스를 N번의 쿼리로 가져오는 문제로 정의하고, Java 프로그램에서 데이터 접근 성능이 나빠지는 가장 흔한 원인이라고 하며 Hibernate의 잘못이 아니라 손으로 쓴 JDBC에서도 생긴다고 한다. 해결 전략으로 외부 조인 fetching, batch fetching, subselect fetching을 들고 그중 외부 조인 fetching을 거의 항상 써야 한다고 한다. 8.5절은 batch fetching이 후속 select에 기본 키 묶음을 쓰며 필요한 배치 수는 설정한 batch size에 달렸다고 하고, batch와 subselect fetching은 기본으로 꺼져 있고 `hibernate.default_batch_fetch_size`, `@BatchSize`, `hibernate.use_subselect_fetch`, `@Fetch(SUBSELECT)`로 켠다고 한다. batch fetching은 N+1을 완화할 뿐 해결하지는 못하며 진짜 해결은 조인으로 가져오는 것이라고 한다. 8.6절은 join fetch를 지정하는 방법으로 JPA `EntityGraph`, HQL/JPQL의 `join fetch` 등을 든다. 사용자 가이드 30.6.1절은 EAGER 연관을 JOIN FETCH하지 않으면 보조 select가 나가 N+1이 될 수 있어 EAGER는 피하라고 한다. Spring Data JPA 문서는 쿼리 메서드에 `@EntityGraph(attributePaths = ...)`를 붙여 연관을 함께 가져오는 임시 엔티티 그래프를 정의할 수 있다고 한다. Spring Boot는 `spring.jpa.properties.*`를 JPA 제공자의 네이티브 속성으로 전달한다고 문서화한다.

(실험 확인) 게시글 목록을 JPQL로 조회한 뒤 서로 다른 작성자 3명의 LAZY 프록시에 접근하면 SQL이 1 + 3번 나간다. 같은 조회를 `join fetch`로 하거나 엔티티 그래프를 주면 SQL은 1번이다. 리포지토리 메서드에 `@EntityGraph`를 붙이면 작성자가 이미 초기화되어 추가 쿼리가 없다.

```java
@EntityGraph(attributePaths = "member")
List<Post> findAllByOrderByIdDesc();     // post + member 를 한 쿼리로

// application.yml (예시 값): spring.jpa.properties.hibernate.default_batch_fetch_size: 100
```
