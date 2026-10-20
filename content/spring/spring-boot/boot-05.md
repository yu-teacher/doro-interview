---
slug: "boot-05"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "주요 `@Conditional*` 어노테이션을 설명해 주세요."
keywords: ["@ConditionalOnClass", "@ConditionalOnMissingBean", "@ConditionalOnProperty", "havingValue", "matchIfMissing"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html"]
concepts: [auto-configuration]
importance: 2
links: [{to: "ioc-27", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@ConditionalOnClass`는 특정 클래스가 클래스패스에 있을 때, `@ConditionalOnMissingBean`은 해당 빈이 아직 없을 때, `@ConditionalOnProperty`는 프로퍼티 조건이 맞을 때 설정을 적용합니다. `@ConditionalOnProperty`는 기본적으로 프로퍼티가 존재하고 `false`가 아니면 매치되고, `havingValue`와 `matchIfMissing`으로 더 세밀하게 조절합니다. 이걸 조합해서 라이브러리가 있고, 사용자가 안 만들었고, 설정으로 끄지 않았으면 기본 빈을 만드는 자동 설정을 작성합니다. `@Bean` 메서드에 `@ConditionalOnClass`를 바로 붙이면 반환 타입 클래스가 먼저 로딩될 수 있어서 별도 중첩 `@Configuration`으로 분리합니다.

- 공식 문서: `@ConditionalOnClass`/`@ConditionalOnMissingClass`는 ASM 으로 어노테이션 메타데이터를 파싱하므로 클래스 레벨에서는 `value`로 실제 클래스를 써도 되지만, `@Bean` 메서드는 반환 타입이 조건 대상이라 JVM이 먼저 클래스를 로드할 수 있다. 이 경우 별도 `@Configuration` 클래스로 조건을 분리하라고 안내한다.
- 공식 문서: `@ConditionalOnProperty`는 `prefix`와 `name`으로 프로퍼티를 지정하고, 기본적으로 존재하면서 `false`가 아닌 값이면 매치된다. 불리언 프로퍼티용 `@ConditionalOnBooleanProperty`도 있고, 여러 이름을 주면 모두 통과해야 한다.
- 공식 문서: `@ConditionalOnBean`/`@ConditionalOnMissingBean`은 클래스 레벨에 붙여도 `@Configuration` 클래스 생성 자체를 막지는 않으며, 클래스 레벨 조건이 안 맞으면 그 설정 클래스가 빈으로 등록되지 않는 차이만 있다.
- (실험 확인) `havingValue = "true"`이면 프로퍼티가 없거나 `false`일 때 꺼지고 `true`일 때만 켜진다. `matchIfMissing = true`이면 프로퍼티가 없을 때 켜지고 `false`로 끌 수 있다. 클래스패스에 없는 클래스에 `@ConditionalOnClass(name = ...)`를 걸면 그 자동 설정 전체가 건너뛰어진다.
