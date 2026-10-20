---
slug: "boot-08"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "프로파일(profile)은 무엇이고, dev/prod는 어떻게 분리하나요?"
keywords: ["application-{profile}.yml", "spring.profiles.active", "spring.profiles.default", "@Profile", "group", "include"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/profiles.html", "https://docs.spring.io/spring-boot/reference/features/external-config.html", "https://docs.spring.io/spring-boot/how-to/data-initialization.html"]
concepts: [externalized-config]
importance: 3
links: [{to: "boot-18", kind: FOLLOWUP}, {to: "ioc-26", kind: RELATED}, {to: "cic-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
프로파일은 환경별로 설정이나 빈을 나눠 적용하는 기능입니다. `@Component`, `@Configuration`, `@ConfigurationProperties`에 `@Profile`을 붙여 로드 조건을 제한할 수 있고, `application-dev.yml`, `application-prod.yml`처럼 `application-{profile}.yml` 파일은 해당 프로파일이 활성일 때 로드되어 기본 파일 위에 덮어씁니다. 활성화는 `spring.profiles.active`로 하고, 활성 프로파일이 없으면 `default` 프로파일이 켜지는데 이름은 `spring.profiles.default`로 바꿀 수 있습니다. 여러 프로파일은 `include`로 더하거나 `group`으로 묶을 수 있습니다.

```yaml
# application.yml
spring:
  profiles:
    default: dev   # active가 없을 때 켜질 프로파일 이름
```

```bash
java -jar app.jar --spring.profiles.active=prod
# 또는
SPRING_PROFILES_ACTIVE=prod java -jar app.jar
```

- 공식 문서: 활성 프로파일이 없으면 `default` 프로파일이 켜지며 이름은 `spring.profiles.default`로 바꿀 수 있다. `spring.profiles.active`는 다른 프로퍼티와 같은 우선순위 규칙을 따르므로 설정 파일에 적어도 명령행 스위치로 대체할 수 있다.
- 공식 문서: `spring.profiles.active`, `default`, `include`, `group`은 프로파일 전용 문서(`application-{profile}` 파일이나 `spring.config.activate.on-profile` 문서) 안에서는 쓸 수 없다.
- 공식 문서: 프로파일 전용 파일은 일반 파일과 같은 위치에서 로드되고 항상 비전용 파일을 덮어쓴다. 프로파일이 여러 개면 나중 것이 이긴다(`prod,live`이면 `live`가 `prod`를 덮어쓴다).
- 공식 문서: `ddl-auto` 값은 `none`, `validate`, `update`, `create`, `create-drop`이고, 임베디드 DB로 판단되고 스키마 도구가 없으면 기본이 `create-drop`, 그 외에는 `none`이다.
- 공식 문서(환경 변수 규칙): 점을 밑줄로 바꾸고 대시를 제거해 대문자로 쓰는 규칙에 따라 `spring.profiles.active`는 `SPRING_PROFILES_ACTIVE`가 된다.
- (실험 확인) `application.yml`에 `spring.profiles.default: dev`를 두고 활성 프로파일 없이 시작하면 `getActiveProfiles()`는 비어 있고 `getDefaultProfiles()`는 `[dev]`이며 `application-dev.yml` 값이 적용된다. `prod`를 활성화하면 `application-prod.yml`이 적용된다.
