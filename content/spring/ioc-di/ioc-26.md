---
slug: "ioc-26"
topic: "ioc-di"
tier: BASIC
difficulty: 2
title: "Environment는 프로파일과 프로퍼티를 어떻게 다루나요?"
keywords: ["@Profile", "spring.profiles.active", "default 프로파일", "PropertySource", "시스템 프로퍼티"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/environment.html"]
---
**모범 답변 (30~60초)**
Environment는 프로파일과 프로퍼티 두 가지를 모델링합니다. `@Profile`은 클래스나 `@Bean` 메서드에 붙여 해당 프로파일이 활성일 때만 등록되게 하고, 설정 클래스에 붙이면 그 안의 `@Bean`과 `@Import`가 통째로 빠집니다. 표현식은 `!`, `&`, `|`를 쓰지만 `&`와 `|`는 괄호 없이 섞을 수 없습니다. 활성화는 `spring.profiles.active`나 `setActiveProfiles`로 하고, 활성 프로파일이 하나도 없을 때만 default 프로파일이 적용됩니다. 프로퍼티는 PropertySource들을 우선순위대로 찾는데, 표준 환경에서는 시스템 프로퍼티가 OS 환경 변수보다 앞서고 값은 병합되지 않고 높은 쪽이 통째로 덮어씁니다.

```java
@Configuration
@Profile("production & (us-east | eu-central)")
public class ProdDataConfig { ... }
```

(공식 문서) environment 페이지에 근거한다. 같은 이름의 오버로드된 `@Bean` 메서드에서는 `@Profile` 조건이 첫 선언만 유효하므로 일관되게 선언해야 하고, 다른 조건의 대체 빈은 메서드 이름을 달리하고 `@Bean("name")`으로 빈 이름을 맞추라고 안내한다. 웹 환경은 서블릿·JNDI 소스가 더해져 우선순위가 달라진다.
