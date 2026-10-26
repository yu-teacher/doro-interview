---
slug: "obs-04"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 1
title: "관측성의 세 가지 신호인 로그, 메트릭, 트레이스는 각각 무엇이고 어떻게 다른가요?"
keywords: ["로그는 시각이 있는 이벤트 기록", "메트릭은 기간별 수치 집계", "트레이스는 요청의 경로", "원인 분석에 세 신호를 함께 사용", "관측성은 외부 출력으로 내부를 이해"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://opentelemetry.io/docs/concepts/observability-primer/", "https://opentelemetry.io/docs/concepts/signals/"]
concepts: [observability]
importance: 3
links: [{to: "dst-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
로그는 시각이 찍힌 개별 이벤트 메시지이고, 메트릭은 요청 수, 오류율, CPU 사용률처럼 일정 기간 동안의 수치를 집계한 값이며, 트레이스는 하나의 요청이 여러 서비스를 거쳐 가는 경로를 span 단위로 기록한 것입니다. 메트릭으로 이상이 있다는 것을 알아채고, 트레이스로 어느 구간이 느린지 좁히고, 로그로 그 시점에 무슨 일이 있었는지 확인하는 식으로 함께 씁니다. 관측성은 시스템이 내보내는 이런 출력만으로 내부 상태를 이해할 수 있는 정도를 말합니다.

(공식 문서) OpenTelemetry 관측성 입문은 관측성을 시스템 내부를 몰라도 외부에서 질문을 던져 이해할 수 있게 하는 것으로 정의하고, 이를 위해 trace, metric, log 같은 신호를 내보내야 한다고 한다. 로그는 타임스탬프가 있는 메시지이며 요청과 꼭 연결되지는 않고, 메트릭은 일정 기간에 대한 숫자 데이터의 집계이며, 분산 트레이스는 하나의 요청이 여러 서비스를 거치는 경로로 하나 이상의 span으로 이루어진다고 한다.
(공식 문서) signals 문서는 현재 지원하는 신호로 traces, metrics, logs, baggage를 든다.
(보충) 메트릭으로 감지하고 트레이스로 좁히고 로그로 확인하는 순서는 일반적인 사용 흐름의 설명이며 공식 문서의 서술이 아니다. 실험하지 않았다.
