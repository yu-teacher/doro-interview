---
slug: "boot-09"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "`@ConfigurationProperties`와 `@Value`는 어떻게 다른가요?"
keywords: ["타입 안전 바인딩", "relaxed binding", "메타데이터", "검증", "SpEL"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"`@Value`는 필드 하나에 프로퍼티 하나를 주입하는 방식이고, `@ConfigurationProperties`는 접두사 아래의 설정을 객체 하나로 묶어서 타입 안전하게 바인딩합니다. 설정이 여러 개이거나 중첩 구조이면 `@ConfigurationProperties`가 훨씬 낫습니다. 이 방식은 relaxed binding을 지원해서 `context-path`, `contextPath`, 환경 변수 표기를 같은 키로 인식하고, 검증을 붙일 수 있고, IDE 자동완성용 메타데이터도 생성됩니다. 반면 단순한 값 하나나 SpEL이 필요할 때는 `@Value`가 간단합니다."

- (실험 확인) 환경 변수 스타일(`UPPER_SNAKE`)을 포함해 kebab, camelCase, snake_case 키가 `@ConfigurationProperties`에 모두 바인딩된다. `@Value`는 kebab 표준 형태로 쓸 때만 다른 표기의 프로퍼티와 매칭되고(`@Value("${exp.board.max-post-size}")`는 `maxPostSize` 키를 찾지만 `@Value("${exp.board.maxPostSize}")`는 kebab 키를 못 찾는다), 방향이 한쪽이다. 이 프로젝트에는 `hibernate-validator`가 없어서 `@NotBlank` 같은 Bean Validation 기반 `@Validated` 검증은 동작하지 않는다(`spring-boot-starter-validation` 필요). 확인 테스트: `experiment/boot/ConfigurationPropertiesExperimentTest`.

```java
@ConfigurationProperties(prefix = "app.board")
public record BoardProperties(int pageSize, boolean writeEnabled) {}
```

- 공식 문서: `@ConfigurationProperties`는 IDE 자동완성을 위한 메타데이터 파일을 생성할 수 있고, relaxed binding 규칙(`context-path` -> `contextPath`, `DEMO_ITEMPRICE` -> `demo.item-price`)이 있다.
- (보충) `@Value`가 정확한 키 이름과 SpEL을 지원하고 `@ConfigurationProperties`가 검증/중첩 바인딩에 강하다는 비교는 공식 페이지의 해당 비교 절을 읽지 못하고 일반 지식으로 적은 것이다. 위 `BoardProperties` 예제는 설명용이며 데모에는 없다.
- 공식 문서: `@ConfigurationProperties` 클래스에도 `@Profile`을 붙일 수 있다.
