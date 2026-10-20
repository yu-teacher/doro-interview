---
slug: "boot-15"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "Spring Boot 4에서 무엇이 바뀌었나요?"
keywords: ["Spring Framework 7", "모듈화 starter", "spring-boot-starter-webmvc", "Jackson 3", "JsonMapper", "@MockitoBean"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"크게 세 가지를 말씀드립니다. 첫째, Spring Framework 7 기반으로 올라갔고 Spring Security 7, Spring Batch 6 등도 함께 올라갔습니다. 둘째, 모듈이 잘게 나뉘어 starter 이름이 기술별로 정리됐습니다. 대표적으로 `spring-boot-starter-web`은 deprecated 되고 `spring-boot-starter-webmvc`를 쓰며, 기술마다 `-test` starter가 따로 있습니다. 셋째, Jackson 3가 기본이 되어 패키지가 `tools.jackson`으로 바뀌고, Boot가 `ObjectMapper` 대신 `JsonMapper` 빈을 구성합니다. 그 밖에 `@MockBean`은 제거되고 `@MockitoBean`을 씁니다. 데모 프로젝트가 `spring-boot-starter-webmvc`와 `*-test` starter를 쓰는 게 바로 이 변화입니다."

- 공식 릴리스 노트: Spring Framework 7.0 / Spring Security 7.0 / Spring Data 2025.1 / Spring Batch 6.0로 이동, Jackson 3.0이 기본이며 Jackson 2는 deprecated 형태로만 제공, Servlet 6.1, Tomcat 11.0 등.
- 공식 마이그레이션 가이드: 최소 Java 17, Jakarta EE 11 기반. `spring-boot-<technology>` 모듈과 `spring-boot-starter-<technology>` 명명, `starter-web` -> `starter-webmvc`, Flyway/Liquibase 등은 전용 starter 필요. `<technology>-test` starter 제공, `spring-boot-starter-classic`은 마이그레이션 중간 단계용. Jackson 3는 `tools.jackson` 패키지(`jackson-annotations`는 기존 좌표 유지), `JsonMapper`/`XmlMapper` 자동 구성, `@JsonComponent` -> `@JacksonComponent`, `@MockBean`/`@SpyBean` 제거 -> `@MockitoBean`/`@MockitoSpyBean`.
- 데모는 Java 21 툴체인과 Boot 4.1.1을 사용한다(`build.gradle`).
- 릴리스 노트 페이지는 모듈형 starter를 다루지 않고, 그 내용은 마이그레이션 가이드에서 확인했다. 두 페이지 모두 일부 구간만 읽었다.
