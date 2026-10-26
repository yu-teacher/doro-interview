---
slug: "obs-07"
topic: "cloud-iac-observability"
tier: BASIC
difficulty: 2
title: "Prometheus의 메트릭 유형 Counter, Gauge, Histogram은 각각 언제 쓰나요?"
keywords: ["Counter는 증가만 하는 누적값", "Gauge는 오르내리는 현재 값", "Histogram은 버킷 분포", "요청 수에 Counter 사용", "라벨에 사용자 ID 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://prometheus.io/docs/concepts/metric_types/", "https://prometheus.io/docs/practices/naming/", "https://prometheus.io/docs/prometheus/latest/querying/functions/"]
concepts: [slo-metrics, observability]
importance: 2
---
**모범 답변 (30~60초)**
Counter는 처리한 요청 수나 오류 수처럼 증가만 하는 누적값으로, 재시작하면 0으로 돌아갈 수 있습니다. 초당 증가량은 `rate()`로 보는데 이때 재시작에 의한 리셋은 자동 보정됩니다. Gauge는 현재 메모리 사용량이나 동시 요청 수처럼 오르내리는 값입니다. Histogram은 요청 시간 같은 관측값을 버킷별 개수와 합계로 기록해 나중에 분위수를 계산하게 해 줍니다. 줄어들 수 있는 값을 Counter로 쓰면 안 되고, 라벨에 사용자 ID처럼 값이 무한한 것을 넣으면 시계열이 폭증합니다.

(공식 문서) Prometheus 메트릭 유형 문서는 Counter를 증가하거나 재시작 시 0으로 리셋되기만 하는 누적 메트릭으로 설명하고, 줄어들 수 있는 값에는 쓰지 말고 Gauge를 쓰라고 한다. Gauge는 임의로 오르내리는 단일 수치이고, Histogram은 관측값(보통 요청 시간이나 응답 크기)을 설정 가능한 버킷에 세고 합계도 제공한다고 한다.
(공식 문서) 함수 문서의 `rate()` 설명은 타깃 재시작 등으로 인한 카운터 리셋 같은 단조성 깨짐이 자동으로 보정된다고 한다. 네이밍 문서는 라벨 키-값 조합마다 새 시계열이 생기므로 사용자 ID, 이메일처럼 값이 무한한 차원을 라벨에 쓰지 말라고 한다.
실험하지 않았다.
