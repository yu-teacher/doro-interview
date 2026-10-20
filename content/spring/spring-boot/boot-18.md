---
slug: "boot-18"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "`spring.profiles.active`와 `spring.profiles.include`의 차이는 무엇인가요?"
keywords: ["active", "include", "group", "공통 프로파일"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`active`는 활성 프로파일 목록 자체를 지정하는 것이라 명령행으로 다시 지정하면 대체될 수 있습니다. `include`는 거기에 항상 추가로 얹는 프로파일이라, `active`를 명령행에서 바꿔도 include된 프로파일은 유지됩니다. 여러 프로파일을 묶어서 한 이름으로 켜고 싶으면 `spring.profiles.group`을 씁니다. 예를 들어 `production` 하나만 켜면 `proddb`, `prodmq`가 함께 켜지게 할 수 있습니다."

```yaml
spring:
  profiles:
    group:
      production:
        - proddb
        - prodmq
```

- 공식 문서: include로 추가된 프로파일은 active를 어디서 지정하든 위에 얹히고, active 프로파일보다 먼저 추가된다. group 예시는 위와 같다.
