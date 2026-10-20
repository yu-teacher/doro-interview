---
slug: "jpa-30"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "대량 데이터를 처리할 때 JPA에서 주의할 점은?"
keywords: ["flush/clear", "SEQUENCE + batch_size", "벌크 연산", "clearAutomatically", "콜백 미호출"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html"]
---
**모범 답변 (30~60초)**
첫째, 영속성 컨텍스트에 엔티티가 계속 쌓이면 메모리와 더티 체킹 비용이 커지므로 주기적으로 `flush()` 후 `clear()`로 비웁니다. 공식 문서는 한꺼번에 많이 넣으면 메모리 부족 위험이 있다고 설명합니다. 둘째, IDENTITY는 INSERT 배치가 꺼지므로 대량 INSERT에는 SEQUENCE와 JDBC 배치 설정(`hibernate.jdbc.batch_size`)을 씁니다. 셋째, 대량 수정과 삭제는 엔티티를 하나씩 바꾸지 말고 `@Modifying` 벌크 쿼리를 쓰되, 벌크 쿼리는 영속성 컨텍스트에 반영되지 않으니 `clearAutomatically`로 컨텍스트를 비우는 걸 고려합니다. Spring Data 문서에 따르면 파생 delete 쿼리는 엔티티를 하나씩 로딩해 삭제하지만 `@Query` 벌크 delete는 단일 쿼리이고 생명주기 콜백이 호출되지 않습니다.

```java
for (int i = 0; i < total; i++) {
    em.persist(new Person(...));
    if (i > 0 && i % batchSize == 0) {
        em.flush();   // 쌓인 변경을 DB로 보내고
        em.clear();   // 컨텍스트를 비워 메모리를 해제
    }
}
```

(공식 문서) Hibernate 사용자 가이드 13.2절(Session batching)은 10만 건을 그냥 persist하면 모든 엔티티가 영속성 컨텍스트에 쌓여 JVM 메모리가 낮으면 OutOfMemory가 날 수 있고, JDBC 배치는 기본으로 꺼져 있으니 `hibernate.jdbc.batch_size`를 10~50 사이로 설정하라고 하며, identity 식별자 생성기를 쓰면 insert 배치가 투명하게 비활성화된다고 한다. 13.2.1절은 새 객체를 영속화할 때 `flush()`와 `clear()`를 주기적으로 호출해 1차 캐시 크기를 제어하라고 하고, 13.2.2절은 조회 후 수정할 때도 그렇게 하라고 한다. 3.7.10절과 30.4.1절은 IDENTITY가 INSERT 배치를 막고, DB가 시퀀스를 지원하면 시퀀스를 쓰라고 한다. 17.2절은 HQL update/delete의 효과가 영속성 컨텍스트와 메모리의 엔티티 상태에 반영되지 않으며 동기화는 애플리케이션 책임이라고 한다. Hibernate 입문서 5.9절은 flush가 영속성 컨텍스트의 모든 엔티티를 더티 체크하는 비싼 작업이라고 한다. Spring Data JPA "Modifying Queries"와 "Derived Delete Queries" 절은 위 서술대로 `clearAutomatically` 속성과 파생 delete의 한 건씩 삭제, `@Query` 벌크 delete의 단일 쿼리·콜백 미호출을 설명한다.
