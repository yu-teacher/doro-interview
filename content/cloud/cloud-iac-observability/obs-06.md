---
slug: "obs-06"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 1
title: "SLI, SLO, SLA는 각각 무엇이고 어떻게 구분하나요?"
keywords: ["SLI는 서비스 수준의 측정값", "SLO는 SLI의 목표", "SLA는 어겼을 때 결과가 있는 계약", "지연 시간과 오류율과 가용성", "사용자가 중요하게 여기는 것에서 출발"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://sre.google/sre-book/service-level-objectives/", "https://opentelemetry.io/docs/concepts/observability-primer/"]
concepts: [slo-metrics]
importance: 2
---
**모범 답변 (30~60초)**
SLI는 요청 지연 시간, 오류율, 가용성처럼 서비스 수준을 정량적으로 잰 값이고, SLO는 그 SLI에 대한 목표값입니다. 예를 들어 요청의 99%가 100밀리초 안에 끝난다는 식입니다. SLA는 SLO를 못 지켰을 때 환불 같은 결과가 따르는 사용자와의 계약입니다. 구분하는 쉬운 방법은 목표를 못 지키면 어떤 일이 생기는지 묻는 것이고, 명시적인 결과가 없다면 SLO에 가깝습니다. SLO를 정할 때는 측정하기 쉬운 것보다 사용자가 실제로 중요하게 여기는 것에서 출발하라고 SRE 책은 권합니다.

(원저자 자료) Google SRE 책 4장은 SLI를 서비스 수준의 한 측면을 정량적으로 정의한 측정값으로, SLO를 SLI로 측정하는 서비스 수준의 목표값 또는 범위로, SLA를 SLO를 충족하거나 못 했을 때의 결과를 포함하는 명시적 또는 암묵적 계약으로 정의한다. 'SLO를 못 지키면 무슨 일이 생기는가'를 물어 명시적 결과가 없으면 SLO일 가능성이 높다고 구분법을 제시한다. 같은 장은 사용자가 무엇을 중요하게 여기는지에서 출발하라고 권고한다.
(공식 문서) OpenTelemetry 관측성 입문도 SLI를 서비스 동작의 측정값, SLO를 신뢰성을 조직에 전달하는 수단으로 간단히 설명한다.
실험하지 않았다.
