---
slug: "boot-21"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "Boot 3에서 4로 올릴 때 무엇부터 점검하나요?"
keywords: ["마이그레이션 가이드", "starter 이름", "Jackson 3", "@MockitoBean", "classic starter"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes"]
concepts: [spring-migration, dependency-management]
links: [{to: "misc-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
마이그레이션 가이드는 먼저 최신 3.5.x로 올려 deprecated 호출을 정리하고, Java 17 이상과 Spring Framework 7을 맞추라고 합니다. 그다음 starter 이름을 점검해 `starter-web`은 `starter-webmvc`로 바꾸고, Flyway나 Liquibase는 전용 starter를 추가합니다. Jackson 3로 패키지가 `tools.jackson`으로 바뀌어서 `ObjectMapper` 설정은 `JsonMapper`로, `@JsonComponent`는 `@JacksonComponent`로 바꾸고, 테스트의 `@MockBean`은 `@MockitoBean`으로 교체합니다. 한 번에 어려우면 classic starter나 `spring-boot-jackson2`를 임시 단계로 쓰되 오래 두지 않습니다.

- 공식 마이그레이션 가이드: 시작 전에 최신 3.5.x로 업그레이드하고 deprecated 호출을 정리한다(3.x에서 deprecated 된 것은 4.0에서 제거). 의존성 변화를 검토하고, 시스템 요구사항은 Java 17 이상, Jakarta EE 11(Servlet 6.1), Spring Framework 7.x이다. 설정 프로퍼티 이름 변경은 `spring-boot-properties-migrator`를 일시적으로 붙여 진단하되 마이그레이션이 끝나면 제거한다.
- 공식 마이그레이션 가이드(starter): 새 모듈 설계로 starter가 `spring-boot-starter-<technology>`로 정리되고 test starter가 짝으로 있다. `spring-boot-starter-web`은 `spring-boot-starter-webmvc`로 대체(deprecated)되며 Flyway·Liquibase는 전용 starter가 필요하다. 이행 전략으로 `spring-boot-starter-classic`(테스트는 `spring-boot-starter-test-classic`)을 중간 단계로 써서 import를 고치고 동작을 확인한 뒤 제거하고, 최종적으로 classic starter에서 벗어나기를 권장한다.
- 공식 마이그레이션 가이드(Jackson): `com.fasterxml.jackson`이 `tools.jackson`으로 바뀌고(`jackson-annotations`만 예외), `JsonMapper`/`XmlMapper`가 자동 구성되며 교체하려면 `JsonMapper` 빈을 정의해야 한다. `@JsonComponent`는 `@JacksonComponent`로 바뀐다. 마이그레이션 보조로 `spring.jackson.use-jackson2-defaults`와 deprecated 상태의 `spring-boot-jackson2` 모듈이 있고 후자는 향후 제거될 임시 수단이다.
- 공식 마이그레이션 가이드(테스트): `@MockBean`/`@SpyBean`이 제거되어 `@MockitoBean`/`@MockitoSpyBean`을 쓴다. `@SpringBootTest`는 더 이상 MockMvc를 제공하지 않아 `@AutoConfigureMockMvc`가 필요하다.
- 확인 범위: 가이드 페이지를 처음부터 끝까지 읽었다.
