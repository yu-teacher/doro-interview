---
slug: "boot-15"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "Spring Boot 4에서 무엇이 바뀌었나요?"
keywords: ["Spring Framework 7", "모듈화 starter", "spring-boot-starter-webmvc", "Jackson 3", "JsonMapper", "@MockitoBean"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide"]
---
**모범 답변 (30~60초)**
크게 세 가지입니다. 첫째, Spring Framework 7 기반으로 Spring Security 7, Batch 6 등이 함께 올라갔고 Java 17 이상, Jakarta EE 11이 기준입니다. 둘째, 모듈이 작게 나뉘어 starter가 `spring-boot-starter-<기술>`로 정리되고 기술마다 `-test` starter가 있으며, `spring-boot-starter-web`은 deprecated 되어 `spring-boot-starter-webmvc`를 씁니다. 셋째, Jackson 3가 기본이 되어 패키지가 `tools.jackson`으로 바뀌고 JSON용 `JsonMapper`가 자동 구성됩니다. 테스트에서는 `@MockBean`이 제거되고 `@MockitoBean`을 씁니다.

- 공식 릴리스 노트: Spring Framework 7.0, Spring Security 7.0, Spring Data 2025.1, Spring Batch 6.0 등으로 이동했고 의존성으로 Jackson 3.0, Jakarta Servlet 6.1, Tomcat 11.0, Hibernate 7.2 등이 올랐다. Jackson 2 지원은 deprecated 형태로 제공된다.
- 공식 마이그레이션 가이드(시스템 요구사항): 최소 Java 17, Jakarta EE 11 기반(Servlet 6.1 baseline)이며 Spring Framework 7.x를 써야 한다.
- 공식 마이그레이션 가이드(모듈·starter): 새 모듈 설계로 모듈은 `spring-boot-<technology>`, 루트 패키지는 `org.springframework.boot.<technology>`, starter는 `spring-boot-starter-<technology>`이고 테스트 모듈·starter는 `-test` 접미사다. 모든 test starter는 `spring-boot-starter-test`를 전이로 가져온다. Flyway·Liquibase처럼 이전에 starter가 없던 기술은 전용 starter가 필요하다. `spring-boot-starter-web`은 `spring-boot-starter-webmvc`로 대체되어 deprecated 이다. 마이그레이션 중간 단계용 classic starter가 있다.
- 공식 마이그레이션 가이드(Jackson): Jackson 3가 선호 JSON 라이브러리이고 `com.fasterxml.jackson`이 `tools.jackson`으로 바뀌었다(`jackson-annotations`만 기존 좌표·패키지 유지). JSON용 `JsonMapper`, XML용 `XmlMapper`가 자동 구성되고, 자동 구성된 빈을 교체하려면 `ObjectMapper` 빈으로는 충분하지 않고 `JsonMapper`/`XmlMapper` 빈을 정의해야 한다. `@JsonComponent`는 `@JacksonComponent`로 바뀌었다.
- 공식 마이그레이션 가이드(테스트): `@MockBean`/`@SpyBean` 지원이 제거되고 `@MockitoBean`/`@MockitoSpyBean`으로 대체되었다.
- 확인 범위: 릴리스 노트와 마이그레이션 가이드 두 페이지를 전체 읽었다.
