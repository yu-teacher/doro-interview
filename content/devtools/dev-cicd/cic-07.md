---
slug: "cic-07"
topic: "dev-cicd"
tier: BASIC
difficulty: 2
title: "스프링 부트 애플리케이션의 환경별(개발·스테이징·운영) 설정은 어떻게 분리하고, 같은 설정이 여러 곳에 있으면 무엇이 우선하나요?"
keywords: ["spring.profiles.active", "프로파일별 설정 파일", "환경 변수로 외부 주입", "명령행 인자가 최우선", "비밀값은 이미지에 넣지 않음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/profiles.html", "https://docs.spring.io/spring-boot/reference/features/external-config.html"]
concepts: [externalized-config]
importance: 3
links: [{to: "boot-08", kind: RELATED}, {to: "boot-07", kind: RELATED}, {to: "arc-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
프로파일을 씁니다. `spring.profiles.active=prod`로 활성 프로파일을 정하면 `application-prod.properties`와 `@Profile("prod")`가 붙은 빈이 적용되고, 아무것도 지정하지 않으면 `default` 프로파일이 쓰입니다. 같은 키가 여러 곳에 있으면 PropertySource 우선순위로 정해지는데, 설정 파일보다 OS 환경 변수가, 환경 변수보다 명령행 인자가 이깁니다. 그래서 같은 JAR나 이미지에 환경 변수만 바꿔 넣어 스테이징과 운영에 배포할 수 있습니다. 비밀번호 같은 값은 코드나 이미지에 넣지 않고 CI의 secrets나 배포 환경에서 주입합니다. 환경 변수에서는 점 대신 밑줄을 쓰므로 `spring.profiles.active`는 `SPRING_PROFILES_ACTIVE`가 됩니다.

```bash
# application.properties 의 exp.greeting 을 설정이 차례로 덮어쓴다
SPRING_PROFILES_ACTIVE=prod java -jar app.jar
EXP_GREETING=from-env java -jar app.jar
EXP_GREETING=from-env java -jar app.jar --exp.greeting=from-cli
```

(공식 문서) Profiles 문서는 `spring.profiles.active`로 활성 프로파일을 정하고, 지정이 없으면 `default` 프로파일이 켜지며, 명령행 스위치가 `application.properties`의 값을 대체한다고 설명한다. Externalized Configuration 문서는 PropertySource를 설정 파일, OS 환경 변수, Java 시스템 프로퍼티, `SPRING_APPLICATION_JSON`, 명령행 인자 순으로 두고 뒤에 오는 것이 앞의 값을 덮어쓴다고 하며, 환경 변수에서는 점 대신 밑줄을 쓸 수 있다고 한다. 같은 문서는 환경 변수에 값을 두는 데 단점이 있고 비밀값이라면 Kubernetes의 ConfigMap·Secret 볼륨 마운트 같은 설정 트리가 대안이라고 안내한다(2026-10-20 원문 확인).
(실험 확인) Spring Boot 4.1.1, JDK 25.0.3의 작은 앱(`application.properties`에 `exp.greeting=from-application-properties`, `application-prod.properties`에 `from-prod-profile`)에서 `/greet`의 응답은 다음과 같았다. 설정 없음은 `from-application-properties`였다(이 문서에 적힌 Spring Boot 4.1 계열 기준). `SPRING_PROFILES_ACTIVE=prod`와 `--spring.profiles.active=prod`는 둘 다 `from-prod-profile`이었다. 환경 변수 `EXP_GREETING`은 파일 값을 덮어썼고 prod 프로파일을 켜도 환경 변수가 이겼다. 환경 변수와 명령행 인자를 같이 주면 명령행 인자 값이 나왔다. 로그에는 지정이 없을 때 `default` 프로파일로 떨어진다는 문구가 찍혔다.
(보충) 같은 이미지를 환경 변수만 바꿔 여러 환경에 배포한다는 운영 원칙과 비밀값을 이미지에 넣지 않는다는 원칙은 일반적인 실무 설명이다.
