---
slug: "kfk-08"
topic: "messaging-kafka"
tier: BASIC
difficulty: 2
title: "Spring에서 `@KafkaListener`로 메시지를 받는 구조는 어떻게 되고, `concurrency`는 무엇을 늘리나요?"
keywords: ["@EnableKafka와 컨테이너 팩토리", "ConcurrentMessageListenerContainer", "concurrency만큼 컨테이너 생성", "topics·topicPattern·topicPartitions", "같은 그룹이면 파티션 분배"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/listener-annotation.html", "https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html"]
concepts: [messaging, partition-consumer-group]
importance: 3
links: [{to: "kfk-16", kind: FOLLOWUP}, {to: "kfk-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`@EnableKafka`를 켜고 리스너 컨테이너 팩토리 빈을 두면, `@KafkaListener`가 붙은 메서드가 리스너 컨테이너에 연결되어 메시지가 올 때마다 호출됩니다. 기본 팩토리 빈 이름은 `kafkaListenerContainerFactory`이고, `ConcurrentKafkaListenerContainerFactory`가 `ConcurrentMessageListenerContainer`를 만듭니다. 토픽은 이름, 정규식 패턴, 명시적 파티션 지정 세 방식으로 정합니다. 이름이나 패턴이면 Kafka의 그룹 관리가 파티션을 나눠 줍니다. `concurrency`를 3으로 하면 내부에 `KafkaMessageListenerContainer` 세 개, 즉 스레드·컨슈머 세 개가 생겨 병렬로 소비하지만 파티션보다 많으면 남는 컨슈머는 놉니다.

(공식 문서) Spring for Apache Kafka 레퍼런스(현행 4.1.2)의 @KafkaListener 절은 이 방식에 `@EnableKafka`와 리스너 컨테이너 팩토리가 필요하고 기본적으로 이름이 `kafkaListenerContainerFactory`인 빈을 기대한다고 한다. 토픽은 `topics`, `topicPattern`, `topicPartitions` 세 방식으로 지정하며, 앞의 둘은 컨슈머 그룹에 따라 Kafka가 파티션을 자동 할당하고 마지막은 명시 지정이라고 한다. `concurrency`는 어노테이션에서 팩토리 설정을 덮어쓸 수 있다.
(공식 문서) 메시지 리스너 컨테이너 문서는 `ConcurrentMessageListenerContainer`가 하나 이상의 `KafkaMessageListenerContainer`에 위임해 다중 스레드 소비를 제공하며 `setConcurrency(3)`이 컨테이너 세 개를 만든다고 한다. 앞의 컨슈머 그룹 질문에서 본 대로 파티션보다 많은 컨슈머는 유휴가 된다는 예도 같은 문서에 있다.
Spring Kafka 라이브러리를 쓸 수 없는 환경이라 리스너·재시도·트랜잭션 동작은 실험하지 않았고, 위 내용은 문서 서술에만 근거한다.
