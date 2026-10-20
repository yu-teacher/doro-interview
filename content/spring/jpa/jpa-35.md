---
slug: "jpa-35"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Spring Data JPA에서 Page, Slice, List 반환 타입은 어떻게 다른가요?"
keywords: ["Page", "Slice", "count 쿼리", "offset", "Window"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html"]
---
**모범 답변 (30~60초)**
Pageable을 받는 메서드의 반환 타입에 따라 달라집니다. Page는 전체 요소 수와 페이지 수를 알려 주기 위해 별도의 count 쿼리를 실행하고, 저장소에 따라 이 비용이 클 수 있다고 공식 문서가 말합니다. Slice는 요청한 크기보다 한 건 더 조회해서 다음 조각이 있는지만 알려 주기 때문에 count 쿼리가 나가지 않지만 전체 개수는 모릅니다. Pageable을 받고 List를 반환하면 해당 범위만 가져오고 메타데이터도 만들지 않습니다. 무한 스크롤처럼 총 개수가 필요 없으면 Slice가 적합합니다. 또 Page와 Slice는 offset 기반이라 offset이 커지면 DB가 전체 결과를 만들어야 해서 비효율적이라고 문서가 적습니다. 대안으로 문서 표에는 키셋 기반 Window가 있고, 이 방식은 적절한 인덱스가 필요하다고 합니다.

```java
Page<User> findByLastname(String lastname, Pageable pageable);
Slice<User> findByLastname(String lastname, Pageable pageable);
List<User> findByLastname(String lastname, Pageable pageable);
```

(공식 문서) query-methods-details 페이지의 "Which Method is Appropriate?" 표에 근거한다. 읽은 페이지는 Spring Data JPA 4.1.1 문서다. Window는 해당 버전 문서 기준이므로 버전 의존이다.
