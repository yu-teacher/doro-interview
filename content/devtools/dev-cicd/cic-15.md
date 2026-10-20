---
slug: "cic-15"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "Spring Boot Actuator의 liveness와 readiness는 무엇이 다르고, 헬스체크에 DB 확인을 넣어도 되나요?"
keywords: ["liveness는 재시작 판단", "readiness는 트래픽 수신 가능 여부", "/actuator/health/liveness", "liveness에 외부 시스템 넣지 않음", "startupProbe"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", "https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html"]
concepts: [graceful-shutdown, observability]
importance: 2
links: [{to: "cic-14", kind: PREREQ}, {to: "boot-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
liveness는 애플리케이션이 살아 있는지를 나타내서, 고장 나면 오케스트레이터가 인스턴스를 재시작하게 하는 신호입니다. readiness는 지금 트래픽을 받을 준비가 되었는지를 나타내서, 준비가 안 됐으면 재시작 없이 트래픽만 끊습니다. Actuator는 `/actuator/health/liveness`와 `/actuator/health/readiness`를 제공하고, readiness는 시작 중과 graceful shutdown 중에는 트래픽 거부 상태가 됩니다. 문서는 liveness가 DB나 외부 API 같은 외부 시스템에 의존하면 외부 장애 때 모든 인스턴스가 재시작되는 연쇄 장애가 날 수 있다고 경고하고, readiness에 외부 시스템을 넣을지도 신중히 판단하라고 합니다. 시작이 오래 걸리면 `startupProbe`를 고려합니다.

```bash
curl localhost:8080/actuator/health/liveness    # {"status":"UP"}
curl localhost:8080/actuator/health/readiness   # {"status":"UP"}
```

(공식 문서) Actuator 문서의 Kubernetes Probes 절은 liveness와 readiness 상태를 전용 health indicator로 노출하고 헬스 그룹 `/actuator/health/liveness`와 `/actuator/health/readiness`로 제공한다고 하며, 이 그룹은 자동으로 활성화되고 `management.endpoint.health.probes.enabled`로 끌 수 있다고 한다. 앱이 시작되는 동안에는 liveness가 `BROKEN`에서 `CORRECT`로, readiness가 `REFUSING_TRAFFIC`에서 시작 작업이 끝나면 `ACCEPTING_TRAFFIC`으로 바뀌고, 종료 중 graceful shutdown 단계에서는 readiness가 다시 `REFUSING_TRAFFIC`이 되며 HTTP 프로브도 요청을 받지 않는다고 표로 설명한다. liveness는 외부 시스템 확인에 의존하면 안 되고(연쇄 재시작 위험), readiness에 외부 시스템을 포함할지는 모든 인스턴스가 공유하는 시스템인지 등을 따져 신중히 정하라고 한다. 시작이 오래 걸리면 liveness HTTP 프로브를 쓰는 `startupProbe`를 고려하고, 관리 포트를 따로 쓰면 메인 서버 포트에서도 확인할 수 있게 `management.endpoint.health.probes.add-additional-paths=true`로 `/livez`와 `/readyz`를 열 수 있다고 한다(2026-10-20 원문 확인).
(실험 확인) Spring Boot 4.1.1, JDK 25.0.3, web과 actuator 스타터를 쓰고 `management.*` 설정을 하나도 두지 않은 앱을 macOS에서 `java -jar`로 띄웠을 때(쿠버네티스 밖) `/actuator/health`가 `groups: ["liveness","readiness"]`를 보여 줬고 두 경로가 모두 200과 `{"status":"UP"}`을 반환했다. SIGTERM을 보낸 뒤 graceful shutdown 중에 `/actuator/health/readiness`를 호출하면 연결 자체가 거부됐다. 이는 문서가 말한 대로 종료 중에는 HTTP 프로브도 응답하지 못한다는 점과 일치한다. 쿠버네티스 위에서의 동작은 실험하지 않았다.
