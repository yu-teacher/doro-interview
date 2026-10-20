---
slug: "boot-07"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "외부 설정과 프로퍼티 우선순위를 설명해 주세요."
keywords: ["우선순위", "명령행 인자", "환경 변수", "relaxed binding", "`${}` 플레이스홀더"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/external-config.html"]
concepts: [externalized-config]
importance: 2
links: [{to: "boot-09", kind: FOLLOWUP}, {to: "boot-17", kind: FOLLOWUP}, {to: "ioc-26", kind: RELATED}, {to: "arc-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
Boot는 여러 소스의 설정을 정해진 PropertySource 순서로 합치고, 뒤에 있는 소스가 앞의 값을 덮어씁니다. 낮은 쪽부터 `application.yml` 같은 config data 파일, OS 환경 변수, 자바 시스템 프로퍼티, `SPRING_APPLICATION_JSON`, 명령행 인자 순입니다. 그래서 `--server.port=9000`은 파일 설정보다 강합니다. 환경 변수는 점을 쓸 수 없는 경우가 많아서 relaxed binding 규칙에 따라 `SPRING_CONFIG_NAME`처럼 대문자와 밑줄로 씁니다. 값 안에서는 `${DB_URL}`이나 `${name:기본값}` 플레이스홀더를 쓸 수 있어서, 운영에서는 비밀번호 같은 값을 파일에 두지 않고 환경 변수로 주입합니다.

```yaml
# application-prod.yml: 값은 환경 변수로 주입
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

- 공식 문서(낮음 -> 높음): 기본 프로퍼티(`setDefaultProperties`) < `@PropertySource` < config data(`application.properties` 등) < `random.*` < OS 환경 변수 < 시스템 프로퍼티 < JNDI < ServletContext/ServletConfig 초기화 파라미터 < `SPRING_APPLICATION_JSON` < 명령행 인자 < 테스트의 `properties` < `@DynamicPropertySource` < `@TestPropertySource` < devtools 전역 설정. 뒤의 소스가 앞의 값을 덮어쓴다.
- 공식 문서: 설정 파일은 클래스패스 루트, 클래스패스 `/config`, 현재 디렉터리, 현재 디렉터리의 `config/`, `config/`의 바로 아래 하위 디렉터리 순으로 찾고 나중 것이 앞의 것을 덮어쓴다. config data 안에서는 jar 안의 기본 파일 < jar 안의 프로파일 파일 < jar 밖의 기본 파일 < jar 밖의 프로파일 파일 순이다. 같은 위치에 `.properties`와 YAML이 있으면 `.properties`가 우선한다.
- 공식 문서: 환경 변수를 쓰는 이유는 대부분의 운영체제가 점으로 구분된 키를 허용하지 않기 때문이고, 변환 규칙은 점을 밑줄로, 대시를 제거하고, 대문자로 바꾸는 것이다(`spring.main.log-startup-info` -> `SPRING_MAIN_LOGSTARTUPINFO`).
- 공식 문서: `${name:default}`처럼 `:`로 기본값을 지정할 수 있고, 플레이스홀더에서는 프로퍼티를 정식 형태(소문자 kebab-case)로 참조하라고 권장한다.
- (실험 확인) `server.port`를 `application.yml`에 두고 시스템 프로퍼티와 명령행 인자(`--server.port=7002`)를 차례로 추가하면 yml < 시스템 프로퍼티 < 명령행 순으로 값이 이겼고, `SpringApplicationBuilder.properties(...)`(기본 프로퍼티)는 yml에 졌다. 기본값이 없는 `${DB_URL}`은 값이 없으면 해석할 때 `IllegalArgumentException`이 났고, 같은 키를 프로퍼티로 주면 해석됐다.
- (보충) "개발용 값도 저장소에 올리지 않는 것이 이상적"이라는 운영 관행 조언은 문서 문장이 아니라 일반적인 보안 권고다.
