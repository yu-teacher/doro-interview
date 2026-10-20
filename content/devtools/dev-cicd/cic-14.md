---
slug: "cic-14"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "무중단 배포에서 Spring Boot의 graceful shutdown은 무엇이고 어떻게 설정하나요?"
keywords: ["SIGTERM 수신 후 새 요청 거부", "진행 중인 요청은 완료 대기", "timeout-per-shutdown-phase", "server.shutdown=immediate", "기본으로 활성화"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html", "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html"]
concepts: [graceful-shutdown]
importance: 2
links: [{to: "cic-15", kind: FOLLOWUP}, {to: "cic-19", kind: FOLLOWUP}, {to: "ioc-22", kind: RELATED}, {to: "dkr-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
앱이 종료 신호(SIGTERM)를 받으면 새 요청은 거부하고, 이미 처리 중인 요청은 유예 시간 안에 끝나기를 기다렸다가 종료하는 것이 graceful shutdown입니다. Spring Boot(4.1 문서 기준)는 내장 Tomcat, Jetty, Reactor Netty에서 기본으로 켜져 있고, 유예 시간은 `spring.lifecycle.timeout-per-shutdown-phase`로 정합니다. 끄려면 `server.shutdown=immediate`로 설정합니다. 롤링 배포에서 이전 인스턴스를 내릴 때 요청이 끊기지 않게 하려면, 유예 시간을 가장 오래 걸리는 요청보다 길게 잡고 배포 도구가 주는 종료 대기 시간도 그보다 길게 맞춰야 합니다. IDE의 정지 버튼처럼 SIGTERM을 보내지 않는 방식으로 끄면 즉시 종료될 수 있습니다.

```properties
spring.lifecycle.timeout-per-shutdown-phase=20s
# 끄려면: server.shutdown=immediate
```

(공식 문서) Graceful Shutdown 문서는 세 내장 웹 서버 모두에서 기본으로 활성화되어 있고 ApplicationContext를 닫는 과정에서 `SmartLifecycle` 빈을 멈추는 가장 이른 단계에서 수행된다고 한다. 유예 시간 동안 기존 요청은 끝나도록 허용하고 새 요청은 허용하지 않으며, Jetty, Reactor Netty, Tomcat은 네트워크 계층에서 새 요청 수신을 멈춘다고 한다. 시간은 `spring.lifecycle.timeout-per-shutdown-phase`로, 끄는 것은 `server.shutdown=immediate`로 설정하며, IDE에서 SIGTERM을 제대로 보내지 않으면 즉시 종료될 수 있다고 한다. Actuator 문서의 프로브 절은 종료 단계에서 graceful shutdown이 진행 중인 요청을 처리하는 동안 새 요청은 거부된다고 표로 설명한다(2026-10-20 원문 확인).
(실험 확인) Spring Boot 4.1.1, JDK 25.0.3, 내장 Tomcat에서 5초가 걸리는 `/slow` 요청을 보낸 1초 뒤 JVM에 SIGTERM을 보냈다. 설정을 따로 주지 않은 기본 상태와 유예 시간 20초 설정 모두 `/slow`는 `slow-done` 200으로 끝났고, 그 사이 새로 보낸 요청은 연결이 거부됐으며, 로그에는 `Commencing graceful shutdown`과 `Graceful shutdown complete`가 찍히고 종료 코드는 143이었다. `--server.shutdown=immediate`에서는 `/slow` 응답을 받지 못하고 연결이 끊겼다. 유예 시간을 요청보다 짧은 2초로 주면 로그에 `ends with 1 bean still running after timeout of 2000ms`가 찍히고 `/slow`가 끊겼다. 즉 유예 시간이 가장 긴 요청보다 짧으면 그 요청은 잃는다.
(보충) 유예 시간을 가장 긴 요청보다 길게 잡고 배포 도구의 종료 대기 시간을 그보다 더 길게 맞추라는 조언은 일반적인 운영 지침이며, 위 문서가 값을 정해 주지는 않는다.
