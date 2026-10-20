---
slug: "boot-18"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "`spring.profiles.active`와 `spring.profiles.include`의 차이는 무엇인가요?"
keywords: ["active", "include", "group", "공통 프로파일"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/profiles.html"]
concepts: [externalized-config]
importance: 1
---
**모범 답변 (30~60초)**
`active`는 활성 프로파일 목록 자체를 지정하는 것이라 다른 프로퍼티와 같은 우선순위 규칙을 따르고, 파일에 적어도 명령행 스위치로 대체할 수 있습니다. `include`는 `active`로 켠 프로파일 위에 추가로 얹는 프로파일이라, `--spring.profiles.active`를 따로 줘도 include한 공통 프로파일은 활성화되고 `active` 프로파일보다 먼저 추가됩니다. 여러 프로파일을 한 이름으로 묶고 싶으면 `spring.profiles.group`을 쓰는데, 예를 들어 `production` 하나를 켜면 `proddb`, `prodmq`가 함께 켜집니다. 셋 다 프로파일 전용 문서 안에서는 쓸 수 없습니다.

```yaml
spring:
  profiles:
    group:
      production:
        - proddb
        - prodmq
```

- 공식 문서: `spring.profiles.active`는 다른 프로퍼티와 같은 순서 규칙을 따르고 가장 높은 PropertySource가 이기므로, `application.properties`에 적고 명령행 스위치로 대체할 수 있다.
- 공식 문서: `spring.profiles.include`는 `active`로 활성화된 프로파일 위에 프로파일을 더한다. 예컨대 `common`, `local`을 include하면 `--spring.profiles.active`로 실행해도 이 둘이 활성화된다. include된 프로파일은 `active` 프로파일보다 먼저 추가되고, 프로퍼티 소스마다 처리되어 일반적인 리스트 병합 규칙은 적용되지 않는다.
- 공식 문서: 프로파일 그룹은 `proddb`, `prodmq` 같은 세분화된 프로파일을 한 논리 이름으로 묶으며, `--spring.profiles.active=production`으로 `production`, `proddb`, `prodmq`를 한 번에 켠다.
- 공식 문서: `active`, `default`, `include`, `group`은 프로파일 전용 파일이나 `spring.config.activate.on-profile` 문서 안에서는 쓸 수 없다.
