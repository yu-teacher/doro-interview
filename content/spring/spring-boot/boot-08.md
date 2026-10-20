---
slug: "boot-08"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "프로파일(profile)은 무엇이고, dev/prod는 어떻게 분리하나요?"
keywords: ["application-{profile}.yml", "spring.profiles.active", "spring.profiles.default", "@Profile", "group", "include"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"프로파일은 환경별로 다른 설정이나 빈을 적용하는 기능입니다. `application-dev.yml`, `application-prod.yml`처럼 `application-{profile}.yml` 파일을 만들면 해당 프로파일이 활성화될 때 로드되어 기본 `application.yml` 위에 덮어씁니다. 활성화는 `spring.profiles.active`로 하고, 아무것도 활성화하지 않았으면 `default` 프로파일이 켜지는데 이름은 `spring.profiles.default`로 바꿀 수 있습니다. 우리 프로젝트는 `spring.profiles.default: dev`로 두어서 로컬에서는 별도 지정 없이 dev가 돌고, 운영에서는 `--spring.profiles.active=prod`나 환경 변수로 prod를 지정합니다."

```yaml
# application.yml (데모)
spring:
  profiles:
    default: dev
```

```bash
java -jar board.jar --spring.profiles.active=prod
# 또는
SPRING_PROFILES_ACTIVE=prod java -jar board.jar
```

- 공식 문서: 활성 프로파일이 없으면 `default`가 켜지고 이름은 `spring.profiles.default`로 변경 가능. `spring.profiles.active`는 명령행으로도 지정 가능하며 우선순위 규칙을 따른다.
- 공식 문서: `spring.profiles.include`는 active와 별개로 추가 프로파일을 얹고, `spring.profiles.group`으로 여러 프로파일을 한 이름으로 묶는다.
- 공식 문서: `active/default/include/group`은 프로파일 전용 파일 안에서는 쓸 수 없다.
- 데모의 dev/prod 차이: dev는 `ddl-auto: update`, SQL/Hikari 디버그 로그. prod는 `ddl-auto: validate`, `hikari.maximum-pool-size: 10`, 접속 정보는 환경 변수. 운영에서 스키마를 자동 변경하지 않는 것이 핵심 차이다.
- (보충) `SPRING_PROFILES_ACTIVE` 환경 변수는 relaxed binding에 따른 일반적 표기이며, 위 문서 페이지에서 이 문자열을 직접 확인하지는 않았다.
