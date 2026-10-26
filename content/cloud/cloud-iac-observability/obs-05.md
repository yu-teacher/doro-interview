---
slug: "obs-05"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 1
title: "OpenTelemetry는 무엇이고, 백엔드(Jaeger, Prometheus 등)와는 어떤 관계인가요?"
keywords: ["관측성 프레임워크", "벤더 중립 표준", "백엔드가 아니다", "API와 SDK와 Collector", "OTLP 프로토콜"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://opentelemetry.io/docs/what-is-opentelemetry/", "https://opentelemetry.io/docs/collector/", "https://opentelemetry.io/docs/collector/architecture/"]
concepts: [observability]
importance: 2
---
**모범 답변 (30~60초)**
OpenTelemetry는 트레이스, 메트릭, 로그 같은 텔레메트리 데이터를 생성하고 수집하고 내보내기 위한 오픈소스 관측성 프레임워크이자 도구 모음입니다. 특정 벤더에 묶이지 않는 표준이라 Jaeger나 Prometheus 같은 오픈소스 백엔드든 상용 서비스든 같은 방식으로 데이터를 보낼 수 있고, 저장과 시각화를 하는 백엔드 자체는 아닙니다. 구성은 API와 언어별 SDK, 데이터 형태를 정한 프로토콜(OTLP), 그리고 데이터를 받아 가공하고 내보내는 Collector 등으로 이루어집니다.

(공식 문서) What is OpenTelemetry 문서는 OpenTelemetry를 텔레메트리의 생성·수집·내보내기를 돕는 오픈소스, 벤더 중립 프레임워크로 설명하고 관측성 백엔드 자체는 아니며 저장과 시각화는 다른 도구에 맡긴다고 한다. 주요 구성으로 명세, 표준 프로토콜, 시맨틱 컨벤션, API, 언어 SDK, 자동 계측, Collector를 든다.
(공식 문서) Collector 문서는 Collector를 텔레메트리를 받고 처리하고 내보내는 벤더 중립 구현이라고 설명한다. 아키텍처 문서는 설정에서 pipeline이 receiver, 선택적 processor, exporter로 구성된다고 한다.
실제로 계측하거나 Collector를 띄워 보지 않았다(실험하지 않았다).
