---
slug: "boot-05"
topic: "spring-boot"
tier: BASIC
difficulty: 1
title: "주요 `@Conditional*` 어노테이션을 설명해 주세요."
keywords: ["@ConditionalOnClass", "@ConditionalOnMissingBean", "@ConditionalOnProperty", "havingValue", "matchIfMissing"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`@ConditionalOnClass`는 특정 클래스가 클래스패스에 있을 때, `@ConditionalOnMissingBean`은 해당 빈이 없을 때, `@ConditionalOnProperty`는 프로퍼티 값이 조건에 맞을 때 설정을 적용합니다. 이걸 조합해서 '라이브러리가 있고, 사용자가 안 만들었고, 설정으로 꺼 놓지 않았으면 기본 빈을 만든다'는 식의 자동 설정을 만듭니다. `@ConditionalOnClass`를 `@Bean` 메서드에 바로 붙이면 반환 타입 클래스가 먼저 로딩될 수 있어서, 별도의 중첩 `@Configuration` 클래스에 붙이는 게 안전합니다."

- 공식 문서: `@ConditionalOnProperty`는 기본적으로 프로퍼티가 존재하고 `false`가 아니면 매치되며, `havingValue`, `matchIfMissing`으로 세밀하게 조절한다. 여러 이름을 주면 모두 만족해야 한다.
- 공식 문서: `@ConditionalOnClass`를 `@Bean` 메서드에 쓸 때는 중첩 설정 클래스로 분리하라고 안내한다.
