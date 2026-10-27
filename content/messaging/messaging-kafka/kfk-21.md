---
slug: "kfk-21"
topic: "messaging-kafka"
tier: TRICKY
difficulty: 3
title: "Spring Kafka의 `@RetryableTopic` 논블로킹 재시도는 어떻게 동작하고, 어떤 제약이 있나요?"
keywords: ["재시도 토픽으로 전달", "백오프 시각까지 파티션 일시 정지", "횟수 소진 후 DLT로 이동", "토픽 순서 보장 상실", "배치 리스너·컨테이너 트랜잭션과 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-kafka/reference/retrytopic.html", "https://docs.spring.io/spring-kafka/reference/retrytopic/how-the-pattern-works.html", "https://docs.spring.io/spring-kafka/reference/retrytopic/features.html", "https://docs.spring.io/spring-kafka/reference/retrytopic/dlt-strategies.html"]
concepts: [dlq-retry]
importance: 1
links: [{to: "kfk-16", kind: PREREQ}, {to: "rmq-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
처리에 실패하면 컨슈머를 막고 재시도하는 대신, 레코드를 백오프 시각이 적힌 재시도 토픽으로 보냅니다. 재시도 토픽의 컨슈머는 시각이 안 됐으면 그 파티션의 소비를 일시 정지했다가 시각이 되면 재개해 다시 처리하고, 또 실패하면 다음 재시도 토픽으로, 횟수를 소진하면 DLT로 보냅니다. 1초에서 시작해 두 배씩 늘리는 4회 설정이면 재시도 토픽 1000, 2000, 4000과 `-dlt` 토픽이 만들어집니다. 원래 토픽의 뒤 메시지가 막히지 않는 대신 그 토픽의 순서 보장은 잃고, 배치 리스너나 컨테이너 트랜잭션과는 함께 못 씁니다. 기본은 고정 1초 간격 최대 3회이고 첫 시도도 횟수에 포함됩니다.

(공식 문서) Spring for Apache Kafka 레퍼런스(현행 4.1.2)의 Non-Blocking Retries 절은 2.7부터 `@RetryableTopic`과 `RetryTopicConfiguration`으로 지원하며 배치 리스너와 컨테이너 트랜잭션과는 함께 쓸 수 없다고 한다. How the Pattern Works 문서는 실패 시 백오프 타임스탬프와 함께 재시도 토픽으로 전달되고 재시도 토픽 컨슈머가 시각이 안 됐으면 해당 파티션 소비를 일시 정지하며 시각이 되면 재개한다고 설명한다. `main-topic`에 1000ms, 배수 2, 최대 4회 예시에서 `main-topic-retry-1000`, `main-topic-retry-2000`, `main-topic-retry-4000`, `main-topic-dlt`가 만들어지고, 이 전략은 그 토픽의 Kafka 순서 보장을 잃게 한다고 경고한다.
(공식 문서) Features 문서는 기본 백오프가 고정 간격 1000ms에 최대 3회 시도이고 첫 시도가 `maxAttempts`에 포함된다고 한다. DLT Strategies 문서는 DLT 핸들러를 지정하지 않으면 기본 로깅 핸들러가 쓰이고, DLT 처리 실패 시 기본 동작은 `ALWAYS_RETRY_ON_ERROR`라고 한다.
Spring Kafka 라이브러리를 쓸 수 없는 환경이라 리스너·재시도·트랜잭션 동작은 실험하지 않았고, 위 내용은 문서 서술에만 근거한다.
