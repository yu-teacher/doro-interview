---
slug: "obs-20"
topic: "cloud-iac-observability"
tier: TRICKY
difficulty: 3
title: "인스턴스별 p99 응답 시간을 평균 내서 서비스 전체 p99라고 해도 되나요? Prometheus의 Summary와 Histogram은 이 점에서 어떻게 다른가요?"
keywords: ["분위수는 평균낼 수 없다", "Summary 분위수는 집계 불가", "Histogram은 버킷을 합산", "histogram_quantile", "버킷 폭만큼의 추정 오차"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://prometheus.io/docs/practices/histograms/", "https://prometheus.io/docs/concepts/metric_types/"]
concepts: [slo-metrics]
importance: 1
---
**모범 답변 (30~60초)**
안 됩니다. 분위수는 평균으로 합칠 수 없어서, 트래픽 양이 다른 인스턴스의 p99를 평균 내면 서비스 전체 p99와 전혀 다른 값이 나옵니다. Summary는 계측하는 쪽이 분위수를 미리 계산해 노출하기 때문에 여러 인스턴스 값을 집계할 수 없고, 나중에 다른 분위수나 시간 구간을 고를 수도 없습니다. Histogram은 관측값을 버킷별 개수로 세어 두기 때문에 버킷 경계가 같으면 인스턴스 사이에 합산할 수 있고, `histogram_quantile`로 서버에서 원하는 분위수를 계산합니다. 다만 값은 추정치이고 오차는 해당 버킷의 폭에 제한됩니다.

(공식 문서) Prometheus 히스토그램과 요약 문서는 Summary의 분위수를 복제된 워커 여러 대에 걸쳐 집계할 수 없고, 계산 후 다른 시간 구간이나 분위수로 다시 계산할 수도 없다고 한다. 비교 표에서 Summary는 'Not aggregatable'이고 클래식 Histogram은 버킷 경계가 바뀌지 않는다는 조건에서 PromQL로 집계가 가능하다고 하며(네이티브 히스토그램은 버킷이 항상 호환된다), 같은 문서는 가능하면 네이티브 히스토그램을 우선하라고 권고하고, 문서의 예로 `histogram_quantile(0.95, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))`를 제시한다. 분위수 추정 오차는 분위수가 속한 버킷의 폭으로 제한된다고 한다(네이티브 히스토그램은 설정한 해상도에 제한).
(실험 확인) 파이썬으로 직접 비교했다(정규분포 난수 `random.gauss`, 시드 1로 만든 합성 데이터). 인스턴스 A는 평균 50밀리초로 9000건, B는 평균 500밀리초로 1000건을 만들자 각각의 p99는 61과 629였다. 두 값의 평균은 345였지만 전체를 합친 실제 p99는 563이었다. 경계를 25·50·75·100·250·500·750·1000으로 잡은 버킷을 합산해 보면 p99는 le=750 버킷에 들어갔다(버킷 폭만큼의 해상도). 이 실험은 분위수를 평균 내는 방식이 틀린다는 것을 보여 주는 계산이고 Prometheus 자체를 실행한 것은 아니다.
