---
slug: "boot-12"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "Boot의 로깅은 어떻게 동작하나요?"
keywords: ["Logback", "logging.level", "로거 그룹(web, sql)", "logging.file.name", "logback-spring.xml"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"starter를 쓰면 기본 로깅 구현은 Logback이고, 기본적으로 콘솔에만 출력합니다. 기본 레벨은 INFO 이상이라 ERROR, WARN, INFO가 찍힙니다. 레벨은 `logging.level.<로거 이름>`으로 조절하고 루트는 `logging.level.root`입니다. 여러 로거를 한 번에 다루는 로거 그룹도 있어서 `logging.level.sql=debug`처럼 쓰면 SQL 관련 로거가 한꺼번에 바뀝니다. 파일로 남기려면 `logging.file.name`이나 `logging.file.path`를 지정하고, 커스텀 Logback 설정은 `logback-spring.xml`을 씁니다."

```yaml
# application-dev.yml (데모 프로젝트)
logging:
  level:
    root: info
    com.kdt.board: info
    org.hibernate.SQL: debug
    com.zaxxer.hikari: debug
```

```yaml
# 그룹 사용 예
logging:
  level:
    sql: debug
```

- 공식 문서: Logback이 starter 사용 시 기본, 콘솔 전용이 기본이며 파일 출력은 설정해야 한다. 파일은 10MB에서 롤링한다. 미리 정의된 그룹 `web`, `sql`이 있고 `sql`에는 `org.hibernate.SQL`이 포함된다.
- 공식 문서: `--debug`는 일부 핵심 로거만 디버그로 올리며, 내 애플리케이션의 모든 DEBUG를 켜지 않는다.
- 공식 문서: `logback.xml`보다 `logback-spring.xml`을 쓰고, 그 안에서 `<springProfile>`을 쓸 수 있다.
- 데모는 개별 로거(`org.hibernate.SQL`)를 지정했는데, 그룹을 쓰면 더 짧게 쓸 수 있다는 점을 언급하면 좋다. prod는 root와 앱 패키지를 info로 유지한다.
