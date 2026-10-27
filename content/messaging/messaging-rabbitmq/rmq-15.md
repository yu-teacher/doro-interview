---
slug: "rmq-15"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 2
title: "SimpleMessageListenerContainer와 DirectMessageListenerContainer는 어떻게 다르고, 동시성은 어떻게 조절하나요?"
keywords: ["SMLC는 소비자별 전용 스레드와 내부 큐", "DMLC는 클라이언트 스레드에서 직접 호출", "concurrentConsumers와 maxConcurrentConsumers", "DMLC는 consumersPerQueue", "DMLC는 자동 확장 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/receiving-messages/choose-container.html", "https://docs.spring.io/spring-amqp/reference/amqp/listener-concurrency.html", "https://docs.spring.io/spring-amqp/reference/amqp/receiving-messages/async-annotation-driven/enable.html"]
concepts: [thread-pool, partition-consumer-group]
importance: 1
links: [{to: "jt-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
SMLC는 소비자마다 전용 스레드를 두고, RabbitMQ 클라이언트 스레드가 받은 메시지를 내부 큐로 그 스레드에 넘겨 처리합니다. 2.0에서 추가된 DMLC는 리스너를 클라이언트 스레드에서 직접 호출해서 스레드 전환이 없고 구조가 더 단순합니다. 동시성은 SMLC에서 `concurrentConsumers`로 소비자 수를, `maxConcurrentConsumers`로 부하에 따라 늘릴 상한을 정하고, DMLC에서는 `consumersPerQueue`로 정하며 자동 확장은 없습니다. `@RabbitListener`의 `concurrency` 속성도 컨테이너 종류에 따라 의미가 다릅니다. 큐를 런타임에 추가하거나 빼는 일은 DMLC가 더 효율적이라고 문서가 설명합니다.

(공식 문서) 컨테이너 선택 문서는 SMLC가 소비자마다 내부 큐와 전용 스레드를 쓰고, DMLC는 리스너를 RabbitMQ 클라이언트 스레드에서 직접 호출해 컨텍스트 전환이 없다고 설명한다. `batchSize`, `consumerBatchEnabled`, `maxConcurrentConsumers`와 자동 확장은 SMLC에만 있고, DMLC는 `consumersPerQueue`로 동시성을 조절하며 런타임에 큐를 추가·제거하는 일이 더 효율적이라고 한다. 리스너 동시성 문서는 SMLC의 `concurrentConsumers`(고정 수)와 `maxConcurrentConsumers`(부하에 따른 증감)를, 엔드포인트 활성화 문서는 `@RabbitListener`의 `concurrency` 값의 의미가 컨테이너 종류에 따라 다르다고 설명한다.
(실험 미실시) Spring AMQP 쪽 동작은 Spring 라이브러리를 쓸 수 없는 환경이라 직접 실행해 확인하지는 않았고 문서 근거만 적었다.
