---
slug: "boot-04"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "자동 설정은 내가 만든 빈이 있으면 어떻게 되나요? (back-off)"
keywords: ["back-off", "@ConditionalOnMissingBean", "exclude", "spring.autoconfigure.exclude"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"자동 설정은 비침투적이라서 제가 같은 타입의 빈을 정의하면 물러납니다. 이 메커니즘이 `@ConditionalOnMissingBean`입니다. 자동 설정 클래스는 사용자 정의 빈이 먼저 등록된 뒤에 평가되기 때문에, 해당 타입의 빈이 없을 때만 기본 빈을 만듭니다. 예를 들어 `DataSource` 빈을 직접 정의하면 기본 임베디드 DB 지원은 빠집니다. 반대로 특정 자동 설정이 싫다면 `@SpringBootApplication(exclude = ...)`이나 `spring.autoconfigure.exclude` 프로퍼티로 제외할 수도 있습니다."

```java
@AutoConfiguration
public final class MyAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean   // 사용자가 정의하면 이 기본 빈은 생성되지 않음
    SomeService someService() { return new SomeService(); }
}
```

- 공식 문서: `DataSource` 직접 정의 시 기본 임베디드 DB가 물러나는 예시, 그리고 `exclude`/`excludeName`/`spring.autoconfigure.exclude` 세 가지 제외 방법이 설명되어 있다.
