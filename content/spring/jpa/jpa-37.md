---
slug: "jpa-37"
topic: "jpa"
tier: DEEP
difficulty: 1
title: "Spring Data JPA Auditing(@CreatedDate 등)은 어떻게 설정하나요?"
keywords: ["@CreatedDate", "@LastModifiedDate", "AuditorAware", "@EnableJpaAuditing", "AuditingEntityListener"]
has_extra: false
status: DRAFT
sources: ["https://docs.spring.io/spring-data/jpa/reference/auditing.html"]
---
**모범 답변 (30~60초)**
엔티티가 언제 누구에 의해 만들어지고 바뀌었는지를 자동으로 기록하는 기능입니다. 엔티티에 @CreatedDate, @LastModifiedDate로 시각을, @CreatedBy, @LastModifiedBy로 사용자를 표시합니다. 날짜 어노테이션은 JDK 8 날짜 타입, long, 레거시 Date 등에 쓸 수 있습니다. 생성·수정 시각만 필요하면 AuditorAware 구현이 필요 없지만, 사용자를 기록하려면 현재 사용자를 알려 주는 AuditorAware 빈이 필요하고 제네릭 타입이 어노테이션을 붙인 속성 타입과 맞아야 합니다. 설정은 @EnableJpaAuditing으로 켜고, 엔티티에는 JPA 엔티티 리스너인 AuditingEntityListener를 @EntityListeners로 등록하는 방식이 문서에 나옵니다.

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
class Post {
    @CreatedDate Instant createdAt;
    @LastModifiedDate Instant updatedAt;
}
```

(공식 문서) auditing 페이지에 근거한다. AuditorAware 빈이 여러 개면 auditorAwareRef로 선택한다. 문서는 spring-aspects 및 orm.xml 관련 요구도 적지만 최신 Boot 4 환경에서의 필요 여부는 확인하지 못해 본문에서 제외했다.
