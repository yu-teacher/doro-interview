---
slug: "ioc-27"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "자바 설정에서 @Import와 @Conditional은 각각 어떤 역할을 하나요?"
keywords: ["@Import", "@Conditional", "matches", "파라미터", "중첩 설정 클래스"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/java/composing-configuration-classes.html"]
---
**모범 답변 (30~60초)**
`@Import`는 다른 설정 클래스의 `@Bean` 정의를 가져와서, 컨테이너에는 진입점 클래스 하나만 넘겨도 되게 합니다. Spring 4.2부터는 일반 컴포넌트 클래스도 임포트할 수 있어 컴포넌트 스캔을 피하고 싶을 때 유용합니다. 임포트한 설정 사이의 의존성은 `@Bean` 메서드 파라미터로 받는 방식이 권장됩니다. `@Conditional`은 `Condition` 구현체의 `matches`가 true일 때만 `@Bean`이나 설정 클래스를 등록하게 하며, `@Profile`도 이 위에 만들어져 있습니다. 주의할 점은 중첩 설정 클래스가 스캔처럼 독립적으로 발견되면 바깥 클래스의 조건이 따라가지 않는다는 것이고, 이때는 조건을 다시 선언하거나 합성 애노테이션으로 묶습니다.

```java
@Configuration
@Import(ConfigA.class)
public class ConfigB { ... }   // ConfigB만 등록해도 ConfigA의 빈이 함께 등록된다
```

(공식 문서) composing configuration classes 페이지에 근거한다. 이 페이지는 `ImportSelector`나 `ImportBeanDefinitionRegistrar`를 다루지 않으므로 여기서는 설명하지 않는다. 설정 클래스는 일찍 처리되므로 설정 클래스 자체에 복잡한 주입을 하지 말라는 경고도 있다.
