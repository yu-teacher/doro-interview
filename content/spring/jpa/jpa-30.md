---
slug: "jpa-30"
topic: "jpa"
tier: TRICKY
difficulty: 3
title: "대량 데이터를 처리할 때 JPA에서 주의할 점은?"
keywords: ["flush/clear", "SEQUENCE + batch_size", "벌크 연산", "clearAutomatically", "콜백 미호출"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
첫째, 영속성 컨텍스트에 엔티티가 계속 쌓이면 메모리와 더티 체킹 비용이 커지므로 주기적으로 `flush()` 후 `clear()`로 비웁니다(보충). 둘째, IDENTITY는 즉시 INSERT라 배치가 어려우므로 대량 INSERT에는 SEQUENCE와 JDBC 배치 설정(`hibernate.jdbc.batch_size` 등)을 씁니다(보충). 셋째, 대량 수정과 삭제는 엔티티를 하나씩 바꾸지 말고 `@Modifying` 벌크 쿼리를 쓰되, 벌크 쿼리는 영속성 컨텍스트를 거치지 않으니 `clearAutomatically`로 컨텍스트를 비우는 걸 고려합니다. **(공식)** Spring Data 문서에 따르면 파생 delete 쿼리는 엔티티를 하나씩 로딩해 삭제하지만 `@Query` 벌크 delete는 단일 쿼리이고 생명주기 콜백이 호출되지 않습니다.
