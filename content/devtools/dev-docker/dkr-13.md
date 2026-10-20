---
slug: "dkr-13"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "Compose의 depends_on만 쓰면 DB가 준비된 뒤 앱이 시작되나요? healthcheck와는 어떻게 함께 쓰나요?"
keywords: ["depends_on은 시작 순서만 보장", "준비 완료는 기다리지 않음", "condition service_healthy", "healthcheck 정의", "앱의 연결 재시도"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/compose/how-tos/startup-order/", "https://docs.docker.com/reference/compose-file/services/", "https://docs.docker.com/reference/dockerfile/"]
concepts: [container, graceful-shutdown]
importance: 1
links: [{to: "dkr-12", kind: PREREQ}, {to: "cic-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. `depends_on` 은 컨테이너를 의존 순서대로 시작할 뿐이고, 기본 문법에서는 의존 서비스가 준비됐는지는 기다리지 않습니다. 그래서 DB 컨테이너가 떠 있어도 아직 연결을 받지 못하는 시점에 앱이 먼저 접속하다 실패할 수 있습니다. 해결하려면 DB 서비스에 `healthcheck` 를 정의하고 `depends_on` 에 `condition: service_healthy` 를 주면, Compose가 헬스체크가 통과할 때까지 기다렸다가 앱을 시작합니다. 다만 운영 중 DB 연결이 잠시 끊기는 경우도 있으므로 앱 쪽 연결 재시도도 함께 두는 것이 좋습니다.

```yaml
services:
  db:
    image: busybox:1.36
    command: sh -c "sleep 6; touch /tmp/ready; sleep 300"
    healthcheck:
      test: ["CMD", "test", "-f", "/tmp/ready"]
      interval: 1s
      retries: 20
  app:
    image: busybox:1.36
    command: sleep 300
    depends_on:
      db:
        condition: service_healthy
```

(공식 문서) Startup order 페이지는 Compose가 `depends_on` 등을 기준으로 의존 순서대로 시작·종료하지만 시작할 때 컨테이너가 준비(ready)될 때까지 기다리지 않고 실행 중이기만 기다린다고 한다. 준비 상태를 감지하려면 `condition` 을 쓰고, `service_healthy` 는 `healthcheck` 로 정의한 건강 상태가 될 때까지, `service_completed_successfully` 는 성공적으로 종료될 때까지 기다린다고 한다. Compose 파일 레퍼런스는 짧은 문법에서는 의존 서비스가 시작된 것만 보장하고 healthy가 되기를 기다리지 않는다고 한다. Dockerfile 레퍼런스의 HEALTHCHECK 절은 헬스 상태가 처음에는 `starting` 이고 검사가 통과하면 `healthy`, 연속 실패가 `retries` 에 이르면 `unhealthy` 가 된다고 한다.
(실험 확인) Docker Engine 29.6.1, Compose v5.3.0에서 위 구조에 `service_started` 조건을 쓰는 서비스를 하나 더 넣어 실험했다(busybox:1.36만 사용). DB 컨테이너가 시작된 시각 대비 `service_started` 서비스는 약 0.08초 뒤에 시작됐고, `service_healthy` 서비스는 DB가 `Healthy` 가 된 약 6.6초 뒤에 시작됐다. `docker compose up` 로그에도 DB에 대한 `Waiting` 과 `Healthy` 가 나왔다.
(보충) 앱 쪽에 연결 재시도를 두라는 말은 운영 중 DB 재시작·일시 단절에 대한 일반적인 권고이며 공식 문서의 서술은 아니다.
