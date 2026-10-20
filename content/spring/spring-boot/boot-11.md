---
slug: "boot-11"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "Actuator는 무엇이고, 기본적으로 무엇이 노출되나요?"
keywords: ["health", "exposure.include", "show-details", "보안", "민감 엔드포인트"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/actuator/index.html", "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", "https://docs.spring.io/spring-boot/reference/using/build-systems.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
---
**모범 답변 (30~60초)**
Actuator는 운영 중인 애플리케이션을 모니터링하고 관리하는 기능으로, HTTP나 JMX 엔드포인트로 상태와 메트릭 등을 제공하며 `spring-boot-starter-actuator`로 추가합니다. 엔드포인트는 접근 허용과 노출이 모두 되어야 사용 가능한데, 기본적으로 HTTP와 JMX에는 `health`만 노출되고 더 열려면 `management.endpoints.web.exposure.include`로 지정하며 `exclude`가 `include`보다 우선합니다. 민감한 정보가 있을 수 있어서 `*`로 전부 여는 건 신중해야 하고, 방화벽이나 Spring Security로 보호합니다. health 상세는 `show-details` 기본값이 `never`라 숨겨집니다.

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "health,info"   # '*'는 YAML에서 따옴표 필요
  endpoint:
    health:
      show-details: when-authorized
```

- 공식 문서: 엔드포인트는 접근이 허용되고 노출되어야 사용 가능하며, HTTP에서는 엔드포인트 ID에 `/actuator` 접두사가 붙는다(`/actuator/health`). 접근은 기본적으로 `shutdown`과 `heapdump`를 제외한 모든 엔드포인트에 제한이 없다. 기본 노출은 HTTP와 JMX 모두 `health`뿐이고 `exclude`가 `include`보다 우선한다. YAML에서 `*`는 따옴표가 필요하다.
- 공식 문서: `management.endpoints.web.exposure.include`를 바꾸기 전에 노출될 엔드포인트에 민감한 정보가 없는지 확인하고, 방화벽 뒤에 두거나 Spring Security로 보호하라고 안내한다. Spring Security가 클래스패스에 있고 다른 `SecurityFilterChain` 빈이 없으면 `/health`를 제외한 모든 엔드포인트가 Boot 자동 설정으로 보호되고, 직접 `SecurityFilterChain` 빈을 정의하면 자동 설정이 물러나 접근 규칙을 전부 직접 제어해야 한다.
- 공식 문서: `show-details`와 `show-components`의 값은 `never`(기본), `when-authorized`, `always`이다. `/env`, `/configprops` 등의 값은 기본적으로 `******`로 마스킹(sanitize)되고 `show-values`를 `never`가 아닌 값으로 바꿔야 보인다.
- 공식 문서: `management.server.port`를 설정하면 관리 엔드포인트를 별도 포트로 분리할 수 있다. `spring-boot-starter-actuator`는 프로덕션 starter 표에 있다.
- (실험 확인) Actuator 의존성이 없는 웹 애플리케이션에서는 `HealthEndpoint` 클래스가 없고 `GET /actuator/health`는 404를 돌려준다. 즉 의존성을 먼저 추가해야 한다.
