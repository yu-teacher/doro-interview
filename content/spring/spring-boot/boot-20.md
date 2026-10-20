---
slug: "boot-20"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "운영 환경에서 Actuator나 DevTools, 로깅 설정을 어떻게 다룰 건가요?"
keywords: ["환경 분리", "최소 노출", "환경 변수 주입", "ddl-auto validate"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/devtools.html", "https://docs.spring.io/spring-boot/gradle-plugin/packaging.html", "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", "https://docs.spring.io/spring-boot/reference/features/logging.html", "https://docs.spring.io/spring-boot/reference/features/external-config.html", "https://docs.spring.io/spring-boot/how-to/data-initialization.html"]
concepts: [externalized-config, observability]
importance: 2
links: [{to: "boot-08", kind: PREREQ}, {to: "boot-11", kind: PREREQ}, {to: "boot-13", kind: PREREQ}]
---
**모범 답변 (30~60초)**
DevTools는 `developmentOnly`로 선언해 실행 가능 jar에서 빠지고, 패키징된 앱에서는 자동 비활성화되어 운영에 영향이 없게 둡니다. Actuator는 기본이 `health`만 노출이니 필요한 엔드포인트만 `include`로 열고, health 상세는 `when-authorized`로 제한하며, Spring Security나 방화벽으로 보호합니다. 로깅은 프로파일별로 나눠서 운영에서는 기본 INFO를 유지하고 SQL 같은 상세 DEBUG 로그는 개발 프로파일에만 둡니다. 접속 정보 같은 환경별 값은 환경 변수로 주입하고, 스키마는 `ddl-auto`를 `validate`로 둡니다.

```yaml
# application-prod.yml (예시)
spring:
  datasource:
    url: ${DB_URL}              # 환경 변수로 주입
  jpa:
    hibernate:
      ddl-auto: validate
management:
  endpoints:
    web:
      exposure:
        include: "health,info"  # 필요한 것만 노출
```

- 공식 문서(DevTools): 패키징된 앱에서는 자동 비활성화되고 repackaged 아카이브에 기본으로 포함되지 않는다. 운영에서 강제로 켜는 것은 보안 위험이다. Gradle 플러그인은 `developmentOnly` 의존성을 실행 가능 jar에서 기본 제외한다.
- 공식 문서(Actuator): 기본 노출은 `health`뿐이며 `include`를 바꾸기 전에 민감 정보 여부를 확인하고 방화벽이나 Spring Security로 보호하라고 안내한다. `show-details`는 `never`가 기본이고 `when-authorized`로 권한 있는 사용자에게만 보일 수 있다.
- 공식 문서(로깅): 기본 레벨은 ERROR, WARN, INFO이고 레벨은 `logging.level.*`로 조절한다. 설정 파일과 프로파일 전용 파일로 환경별 값을 나눌 수 있다(외부 설정 페이지).
- 공식 문서(외부 설정): 같은 애플리케이션 코드를 환경별로 다른 설정으로 돌리도록 설정을 외부화하며, 환경 변수가 설정 파일보다 우선한다.
- 공식 문서(데이터 초기화): `ddl-auto` 값은 `none`, `validate`, `update`, `create`, `create-drop`이고 임베디드 DB가 아니면 기본값은 `none`이다.
- (보충) 운영에서 SQL/풀 DEBUG 로그를 끄고 INFO를 유지하는 것, 비밀번호 같은 값을 환경 변수로 주입하는 것, `validate`를 "스키마를 바꾸지 않고 검증만 하는" 설정으로 쓰는 것은 문서 문장이 아니라 일반적인 운영 권장 관행이다.
