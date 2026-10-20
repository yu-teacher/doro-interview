---
slug: "boot-04"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "자동 설정은 내가 만든 빈이 있으면 어떻게 되나요? (back-off)"
keywords: ["back-off", "@ConditionalOnMissingBean", "exclude", "spring.autoconfigure.exclude"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", "https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html"]
---
**모범 답변 (30~60초)**
자동 설정은 비침투적이라서 제가 같은 타입의 빈을 정의하면 물러납니다. 이 메커니즘이 `@ConditionalOnMissingBean`입니다. 이 조건은 그때까지 처리된 빈 정의를 기준으로 평가되는데, 자동 설정 클래스는 사용자 정의 빈이 모두 등록된 뒤에 로드되도록 보장되기 때문에, 해당 타입의 빈이 없을 때만 기본 빈이 만들어집니다. 예를 들어 `DataSource` 빈을 직접 정의하면 기본 임베디드 DB 지원은 빠집니다. 특정 자동 설정이 싫다면 `@SpringBootApplication(exclude = ...)`, `excludeName`, `spring.autoconfigure.exclude` 프로퍼티로 제외합니다.

```java
@AutoConfiguration
public final class MyAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean   // 같은 타입의 빈이 이미 있으면 이 기본 빈은 생성되지 않음
    SomeService someService() { return new SomeService(); }
}
```

- 공식 문서: 자동 설정은 비침투적이며 직접 `DataSource` 빈을 추가하면 기본 임베디드 DB 지원이 물러난다고 예시한다. `@ConditionalOnMissingBean`은 `@Bean` 메서드에 붙이면 대상 타입이 기본적으로 반환 타입이다.
- 공식 문서: 이 조건은 지금까지 처리된 빈 정의를 기준으로 평가되므로 순서에 주의해야 하며, 자동 설정 클래스는 사용자 정의 빈 정의가 추가된 뒤에 로드되는 것이 보장되기 때문에 `@ConditionalOnBean`/`@ConditionalOnMissingBean`은 자동 설정 클래스에서만 쓰라고 권장한다.
- 공식 문서: 제외 방법은 `exclude`, `excludeName`(클래스가 클래스패스에 없을 때), `spring.autoconfigure.exclude` 프로퍼티이며 어노테이션과 프로퍼티를 함께 쓸 수 있다.
- (실험 확인) 사용자가 같은 타입의 빈을 정의하면 `@ConditionalOnMissingBean` 기본 빈은 등록되지 않고 사용자 빈 하나만 남으며, 사용자 빈이 없으면 기본 빈이 등록된다.
