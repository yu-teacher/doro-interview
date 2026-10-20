---
slug: "dst-18"
topic: "design-distributed"
tier: DEEP
difficulty: 2
title: "마이크로서비스에서 분산 추적과 관측성은 왜 필요하고 어떻게 동작하나요?"
keywords: ["요청 ID 전파", "서비스 간 호출 구간 기록", "로그 집계", "지연·트래픽·오류·포화", "수집 인프라 비용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/observability/distributed-tracing.html", "https://sre.google/sre-book/monitoring-distributed-systems/", "https://martinfowler.com/articles/microservices.html", "https://martinfowler.com/bliki/MicroservicePrerequisites.html"]
concepts: [observability, msa-boundary]
importance: 2
links: [{to: "boot-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
요청 하나가 여러 서비스를 지나가기 때문에, 서비스별 로그와 지표만으로는 어디서 느려지고 어디서 실패했는지 알기 어렵습니다. 분산 추적은 외부 요청마다 고유한 요청 ID를 부여해 관여하는 모든 서비스에 전달하고, 모든 로그 메시지에 그 ID를 넣고, 각 서비스에서 한 작업의 시작과 종료 시각 같은 정보를 중앙 서비스에 기록하는 방식입니다. 그러면 로그 집계에서 ID로 한 요청의 로그를 모아 보고 지연이 생긴 구간을 찾을 수 있습니다. 모니터링의 기본 지표로는 지연, 트래픽, 오류, 포화 네 가지 골든 시그널을 봅니다. 대신 추적 데이터를 모으고 저장할 인프라가 필요합니다.

(원저자 자료) Richardson의 "Distributed tracing"은 외부 모니터링은 전체 응답 시간과 호출 수만 알려 주고 개별 작업을 볼 수 없으며 한 요청의 로그가 여러 서비스에 흩어진다는 문제를 든다. 해법으로 외부 요청마다 고유 ID를 부여하고 관여한 모든 서비스에 전달하며 모든 로그 메시지에 포함하고, 요청과 작업의 시작·종료 시각 등을 중앙 서비스에 기록하라고 한다. 이점은 지연의 원인 파악과 집계 로그 검색이고, 단점은 추적을 모으고 저장하는 데 상당한 인프라가 필요할 수 있다는 점이다. Fowler·Lewis는 서비스가 언제든 실패할 수 있어 실시간 모니터링(기술 지표와 분당 주문 같은 비즈니스 지표)이 중요하며, 코레오그래피와 이벤트 협력을 선호하면 예기치 않은 창발적 행동이 생겨 이를 빨리 잡으려면 모니터링이 필수라고 쓴다. Fowler의 "Microservice Prerequisites"는 서비스가 몇 개를 넘어서면 여러 서비스를 가로지르는 비즈니스 트랜잭션을 추적해야 한다고 한다.
(범위 한정) 위 자료들은 "관측성(observability)"이라는 용어 자체를 정의하지 않으므로, 답변은 분산 추적과 모니터링에 대한 자료의 구체적 설명에 한정했다.
(공식 문서) Google SRE 책의 "Monitoring Distributed Systems"는 사용자 대면 시스템에서 측정할 네 가지를 고르라면 지연, 트래픽, 오류, 포화라고 하며, 지연은 성공 요청과 실패 요청을 구분해 봐야 한다고 한다(느린 오류가 빠른 오류보다 나쁘다고 설명).
