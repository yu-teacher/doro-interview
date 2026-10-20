---
slug: "boot-11"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "Actuator는 무엇이고, 기본적으로 무엇이 노출되나요?"
keywords: ["health", "exposure.include", "show-details", "보안", "민감 엔드포인트"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"Actuator는 운영 중인 애플리케이션을 모니터링하고 관리하는 기능으로, HTTP나 JMX 엔드포인트로 상태, 메트릭 등을 제공합니다. `spring-boot-starter-actuator`를 추가하면 쓸 수 있습니다. 보안상 기본적으로 HTTP에는 `health`만 노출되고, 더 열려면 `management.endpoints.web.exposure.include`로 지정합니다. `env`나 `heapdump`처럼 민감한 엔드포인트가 있어서 `*`로 전부 여는 건 조심해야 하고, Spring Security로 보호하거나 네트워크로 제한해야 합니다. health의 상세 정보는 `show-details`가 기본 `never`라서 숨겨집니다."

- (실험 확인) 이 프로젝트 클래스패스에는 Actuator가 없고 `/actuator/health`는 404가 된다. 확인 테스트: `experiment/boot/EmbeddedServerAndLoggingExperimentTest`.

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

- 공식 문서: 기본 HTTP 노출은 `health`뿐. `exclude`가 `include`보다 우선. `show-details` 기본값은 `never`(`when-authorized`, `always` 가능). `env`/`configprops` 값은 기본적으로 마스킹된다.
- 공식 문서: Spring Security가 있고 `SecurityFilterChain` 빈이 없으면 Boot가 다른 엔드포인트를 보호하는 기본 설정을 한다. 직접 `SecurityFilterChain`을 정의하면 Boot는 물러난다.
- 이 데모의 `build.gradle`에는 Actuator 의존성이 아직 없다. (보충) 실제로 붙이려면 의존성 추가가 먼저다. 또 `/actuator` 기본 경로, `management.server.port` 분리는 일반 지식이다.
