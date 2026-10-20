---
slug: "boot-21"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "Boot 3에서 4로 올릴 때 무엇부터 점검하나요?"
keywords: ["마이그레이션 가이드", "starter 이름", "Jackson 3", "@MockitoBean", "classic starter"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"먼저 Java 17 이상과 Spring Framework 7 계열로 맞춰야 합니다. 그 다음 starter 이름을 점검해서 `starter-web`은 `starter-webmvc`로 바꾸고, Flyway나 Liquibase처럼 이제 전용 starter가 필요한 기술을 추가합니다. Jackson 3로 패키지가 바뀌어서 `ObjectMapper` 사용 코드와 `@JsonComponent` 같은 어노테이션을 `JsonMapper`, `@JacksonComponent`로 바꾸고, 테스트의 `@MockBean`은 `@MockitoBean`으로 교체합니다. 한 번에 어려우면 classic starter나 Jackson 2 브릿지를 임시 단계로 쓸 수 있지만 오래 두지 않는 것이 좋습니다."

- 공식 마이그레이션 가이드: 위 항목들의 근거. `spring-boot-starter-classic`, `spring-boot-jackson2`는 임시 단계용이라고 안내한다.
- 가이드 페이지 일부(마지막 약 2만 자)는 읽지 못했다.
