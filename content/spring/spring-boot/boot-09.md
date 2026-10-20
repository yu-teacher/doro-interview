---
slug: "boot-09"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "`@ConfigurationProperties`와 `@Value`는 어떻게 다른가요?"
keywords: ["타입 안전 바인딩", "relaxed binding", "메타데이터", "검증", "SpEL"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/external-config.html", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide"]
---
**모범 답변 (30~60초)**
`@Value`는 필드 하나에 프로퍼티 하나를 주입하는 방식이고, `@ConfigurationProperties`는 접두사 아래의 설정을 객체 하나로 묶어 타입 안전하게 바인딩합니다. 설정이 여러 개이거나 계층 구조이면 `@ConfigurationProperties`를 권장합니다. 공식 비교표로는 relaxed binding이 `@ConfigurationProperties`는 완전 지원이고 `@Value`는 제한적이며, IDE 자동완성용 메타데이터는 `@ConfigurationProperties`만 지원합니다. 반대로 SpEL 평가는 `@Value`만 됩니다. `@ConfigurationProperties`에는 `@Validated`와 JSR-303 구현체로 검증도 붙일 수 있습니다.

```java
@ConfigurationProperties(prefix = "app.board")
public record BoardProperties(int pageSize, boolean writeEnabled) {}
```

- 공식 문서: `@ConfigurationProperties`는 relaxed binding이 있고 `context-path`가 `contextPath`에 바인딩되며 `PORT`가 `port`에 바인딩된다. `my.main-project.person.first-name`, `firstName`, `first_name`, `MY_MAINPROJECT_PERSON_FIRSTNAME` 표기가 모두 같은 프로퍼티로 바인딩되고, 접두사는 kebab-case여야 한다.
- 공식 문서(비교표): relaxed binding은 `@ConfigurationProperties` Yes, `@Value` Limited. 메타데이터 지원은 Yes/No. SpEL 평가는 No/Yes. `@Value`를 쓰려면 정식 형태(소문자 kebab-case)로 쓰라고 권장한다(`${demo.item-price}`는 `demo.item-price`, `demo.itemPrice`, `DEMO_ITEMPRICE`를 모두 찾지만 `${demo.itemPrice}`는 kebab 표기 키를 찾지 못한다).
- 공식 문서: 키 묶음이 있으면 `@ConfigurationProperties` POJO로 묶기를 권장하고, 메타데이터 파일을 생성해 IDE 자동완성을 제공할 수 있다. 프로퍼티 파일의 SpEL은 환경 구성 시에는 처리되지 않고 `@Value`로 소비될 때 평가된다.
- 공식 문서: `@Validated`를 붙이면 검증을 시도하고, 호환되는 JSR-303(`jakarta.validation`) 구현체가 클래스패스에 있어야 한다. Boot 4에서는 Jakarta Validation 지원이 `spring-boot-starter-validation`이다(마이그레이션 가이드).
- 공식 문서: `@Profile`은 스캔되는 `@ConfigurationProperties` 클래스에 직접 붙일 수 있고, `@EnableConfigurationProperties`로 등록하면 그 `@Configuration` 클래스에 붙인다.
- (실험 확인) `exp.board.max-post-size`, `maxPostSize`, `max_post_size` 키와 환경 변수 스타일(`EXP_BOARD_MAXPOSTSIZE`)이 모두 `@ConfigurationProperties`에 바인딩되고 문자열은 타입 변환된다. `@Value("${exp.board.max-post-size}")`는 `maxPostSize` 키도 찾지만 `@Value("${exp.board.maxPostSize}")`는 kebab 표기 키만 있으면 해석에 실패한다. `@Validated` 프로퍼티 검증이 실패하면 컨텍스트 시작이 실패(`BindValidationException`)했다.
