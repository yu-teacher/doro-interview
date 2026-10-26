---
slug: "obs-13"
topic: "cloud-iac-observability"
tier: DEEP
difficulty: 2
title: "분산 트레이싱에서 trace, span, 컨텍스트 전파(context propagation)는 어떻게 동작하나요?"
keywords: ["span은 작업 단위", "trace는 span들의 묶음", "trace ID와 부모 span ID 전달", "traceparent 헤더", "로그에 trace ID 상관"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://opentelemetry.io/docs/concepts/context-propagation/", "https://opentelemetry.io/docs/concepts/observability-primer/", "https://opentelemetry.io/docs/concepts/signals/logs/"]
concepts: [observability]
importance: 2
links: [{to: "dst-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
span은 하나의 작업 단위로 이름, 시간, 속성을 담고, 하나의 요청이 거치는 span들이 모여 trace가 됩니다. 서비스 A가 서비스 B를 호출할 때 A의 trace ID와 span ID를 컨텍스트로 담아 보내면, B는 그것을 부모로 삼아 같은 trace에 속하는 새 span을 만듭니다. 이렇게 컨텍스트를 서비스 사이로 옮기는 것이 전파이고, HTTP에서는 기본으로 W3C TraceContext 규격의 `traceparent` 헤더를 씁니다. 로그에 trace ID를 넣으면 로그와 트레이스를 서로 찾아갈 수 있습니다.

(공식 문서) Context propagation 문서는 서비스 A가 B를 호출할 때 trace ID와 span ID를 컨텍스트에 담고, B가 그 값으로 같은 trace에 속하며 A의 span을 부모로 하는 새 span을 만든다고 설명한다. 기본 propagator는 W3C TraceContext 규격의 헤더를 쓰며 `traceparent`의 형식은 version-trace-id-parent-id-trace-flags라고 한다. 전파는 보통 계측 라이브러리가 투명하게 처리한다고 한다.
(공식 문서) 관측성 입문은 span을 단일 작업 단위로, trace를 하나의 요청이 여러 서비스를 거치는 경로를 기록한 것으로 설명한다. 컨텍스트 전파 문서는 OpenTelemetry SDK가 로그에 trace ID와 span ID를 자동으로 연결할 수 있다고 하고, logs 문서는 로그 레코드의 최상위 필드에 TraceId와 SpanId가 있다고 한다.
실제 서비스 간 호출로 헤더를 확인해 보지 않았다(실험하지 않았다).
