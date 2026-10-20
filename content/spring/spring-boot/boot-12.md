---
slug: "boot-12"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "Boot의 로깅은 어떻게 동작하나요?"
keywords: ["Logback", "logging.level", "로거 그룹(web, sql)", "logging.file.name", "logback-spring.xml"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/logging.html"]
---
**모범 답변 (30~60초)**
starter를 쓰면 기본 로깅 구현은 Logback이고, 기본적으로 콘솔에만 출력합니다. 기본으로 ERROR, WARN, INFO 레벨 메시지가 찍힙니다. 레벨은 `logging.level.<로거 이름>`으로 조절하고 루트 로거는 `logging.level.root`입니다. 관련 로거를 묶은 로거 그룹도 있어서 미리 정의된 `web`, `sql` 그룹으로 `logging.level.sql=debug`처럼 한 줄에 여러 로거를 바꿀 수 있습니다. 파일로도 남기려면 `logging.file.name`이나 `logging.file.path`를 지정하고, 커스텀 Logback 설정은 `logback-spring.xml`을 씁니다.

```yaml
logging:
  level:
    root: warn
    org.springframework.web: debug   # 개별 로거
    sql: debug                       # 미리 정의된 sql 그룹(org.hibernate.SQL 등)
```

- 공식 문서: starter를 쓰면 기본은 Logback이고, 로거는 콘솔 출력이 기본이며 파일 출력은 선택이다. 기본 레벨은 ERROR, WARN, INFO이다.
- 공식 문서: 기본은 콘솔 전용이고, 파일을 쓰려면 `logging.file.name` 또는 `logging.file.path`를 설정한다. 둘 다 있으면 `logging.file.path`는 무시된다. 로그 파일은 10MB에서 롤링한다.
- 공식 문서: 레벨은 `logging.level.<logger-name>=<level>`(TRACE~OFF)이고 루트는 `logging.level.root`이다. 로깅 그룹은 `logging.group.<이름>`으로 정의하며, 미리 정의된 그룹 `web`(`org.springframework.web` 등)과 `sql`(`org.springframework.jdbc.core`, `org.hibernate.SQL`, `LoggerListener`)이 있다.
- 공식 문서: `--debug`(또는 `debug=true`)는 임베디드 컨테이너, Hibernate, Spring Boot 같은 일부 핵심 로거만 더 자세히 출력하게 하며 애플리케이션의 모든 메시지를 DEBUG로 바꾸지는 않는다.
- 공식 문서: Logback 설정 파일로는 `logback-spring.xml`, `logback.xml` 등을 쓰고, 가능하면 `-spring` 변형을 권장한다. `<springProfile>` 같은 Boot의 Logback 확장은 `logback-spring.xml`에서 쓸 수 있고 표준 `logback.xml`은 너무 일찍 로드되어 확장을 쓸 수 없다.
