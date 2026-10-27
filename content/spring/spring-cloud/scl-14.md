---
slug: "scl-14"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "스프링 부트 3 이후 분산 추적은 어떻게 구성하나요? Spring Cloud Sleuth는 어떻게 되었나요?"
keywords: ["Sleuth 지원 종료", "Micrometer Tracing으로 이전", "트레이서 브리지(Brave·OpenTelemetry)", "자동 구성된 빌더로 전파", "로그 상관관계 ID"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://github.com/spring-cloud/spring-cloud-sleuth", "https://docs.micrometer.io/tracing/reference/index.html", "https://docs.micrometer.io/tracing/reference/glossary.html", "https://docs.spring.io/spring-boot/reference/actuator/tracing.html"]
concepts: [observability]
importance: 2
links: [{to: "obs-13", kind: RELATED}, {to: "dst-18", kind: RELATED}, {to: "obs-05", kind: RELATED}]
---
**모범 답변 (30~60초)**
Spring Cloud Sleuth는 마지막 마이너 버전이 3.1이고 부트 3.x부터는 동작하지 않으며, 핵심이 Micrometer Tracing으로 옮겨 갔습니다. 부트 액추에이터가 Micrometer Tracing을 자동 구성하고, 트레이서는 OpenTelemetry(OTLP)나 Brave와 Zipkin 중에서 의존성으로 고릅니다. 서비스 사이에 트레이스를 전파하려면 자동 구성된 `RestClient.Builder`, `WebClient.Builder`, `RestTemplateBuilder`로 클라이언트를 만들어야 하고, 직접 `new`로 만들면 전파되지 않습니다. 로그에는 기본으로 traceId와 spanId가 상관관계 ID로 들어가고, 기본 샘플링 비율은 10%입니다.

(공식 문서) Sleuth 저장소는 깃허브가 아카이브 상태로 표시하고, 첫 화면은 마지막 마이너 버전이 3.1이며 부트 3.x 이후에는 동작하지 않고 핵심이 Micrometer Tracing 프로젝트로 옮겨졌으며 계측은 Micrometer와 각 프로젝트로 옮겨질 것이라고 밝힌다. Micrometer Tracing 문서는 이것이 사실상 스프링과 무관한 Sleuth의 복사본이고 1.0.0 GA가 2022년 11월에 나왔으며, 인기 있는 트레이서 라이브러리에 대한 파사드이고 `ObservationHandler` 확장으로 `Observation`이 쓰일 때마다 스팬이 만들어진다고 설명한다. 브리지(`micrometer-tracing-bridge-brave`, `...-otel`)와 스팬 리포터를 추가하라고 안내하며, 용어집은 스팬, 트레이스, 트레이싱 컨텍스트, 로그 상관관계를 정의한다.
(공식 문서) 부트 트레이싱 문서는 액추에이터가 Micrometer Tracing의 의존성 관리와 자동 구성을 제공하고 OpenTelemetry와 OTLP, OpenZipkin Brave와 Zipkin 트레이서를 지원한다고 한다. 부트는 백엔드가 과부하되지 않도록 기본으로 요청의 10%만 샘플링하고 `management.tracing.sampling.probability`로 바꾼다. 로그에는 MDC의 traceId와 spanId로 만든 상관관계 ID가 기본으로 들어가고 `logging.pattern.correlation`으로 형식을 바꾼다. 네트워크 전파는 자동 구성된 `RestTemplateBuilder`, `RestClient.Builder`, `WebClient.Builder`로 클라이언트를 만들 때만 자동이고 그렇지 않으면 작동하지 않는다고 경고한다. baggage(트레이스와 함께 전파되는 키·값)는 W3C 전파에서는 자동 전파되고 B3에서는 `management.tracing.baggage.remote-fields`를 설정해야 한다.
