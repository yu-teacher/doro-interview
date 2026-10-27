---
slug: "kfk-04"
topic: "messaging-kafka"
tier: BASIC
difficulty: 1
title: "컨슈머 그룹이란 무엇이고, 파티션 수와 컨슈머 수는 어떤 관계인가요?"
keywords: ["같은 group.id", "파티션은 그룹 안에서 컨슈머 하나에만 할당", "그룹마다 독립적으로 전체 소비", "컨슈머가 파티션보다 많으면 유휴", "멤버가 바뀌면 재할당"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html", "https://kafka.apache.org/43/design/design/", "https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html"]
concepts: [partition-consumer-group]
importance: 3
links: [{to: "kfk-07", kind: FOLLOWUP}, {to: "kfk-13", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
같은 `group.id`를 쓰는 컨슈머들이 하나의 컨슈머 그룹이 되어 작업을 나눕니다. 토픽의 각 파티션은 그룹 안에서 정확히 한 컨슈머에게만 할당되므로, 파티션 4개를 컨슈머 2개가 읽으면 각자 2개씩 맡습니다. 그래서 한 그룹 안에서는 메시지를 한 컨슈머만 받아 큐처럼 동작하고, 그룹이 다르면 각 그룹이 모든 메시지를 따로 받아 발행·구독처럼 동작합니다. 컨슈머를 파티션 수보다 늘려도 처리량은 늘지 않고 남는 컨슈머는 할당을 못 받고 놀게 되므로, 파티션 수가 그룹의 병렬도 상한입니다. 컨슈머가 죽거나 새로 들어오면 파티션이 다시 분배됩니다.

(공식 문서) KafkaConsumer Javadoc은 같은 `group.id`를 공유하는 컨슈머 인스턴스가 한 컨슈머 그룹이며, 구독한 토픽의 각 메시지는 그룹마다 한 프로세스에 전달된다고 설명한다. 각 파티션은 그룹 안에서 정확히 한 컨슈머에 할당되고, 파티션 4개에 프로세스 2개면 각자 2개씩 소비한다는 예가 있다. 한 그룹에 모든 프로세스를 넣으면 큐와 비슷하고, 프로세스마다 자기 그룹을 가지면 발행·구독과 비슷하며, 멤버가 죽거나 들어오면 파티션이 재할당된다고도 한다.
(공식 문서) Spring for Apache Kafka 레퍼런스(현행 4.1.2)의 메시지 리스너 컨테이너 문서는 토픽 3개에 파티션 5개씩이고 `concurrency`가 15이면 기본 `RangeAssignor` 때문에 활성 컨슈머가 5개뿐이고 10개는 유휴라는 예를 든다. Design 문서의 Share Consumer 절은 share group이라는 별도 그룹 종류에서는 컨슈머 수가 파티션 수를 넘을 수 있다고 설명한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 파티션 3개 토픽을 같은 `group.id`의 컨슈머 4개가 구독하자 하나는 빈 할당(`[]`)이었고 나머지 셋이 파티션 하나씩 맡았다(기본 설정, 단일 토픽). 파티션을 가진 컨슈머를 닫자 남은 셋 사이에 재할당이 일어나 놀던 컨슈머도 파티션을 받았다. 다만 떠난 컨슈머의 파티션을 그대로 넘겨받은 것이 아니라 기본 할당(Range)이 세 파티션을 처음부터 다시 나눠, 다른 컨슈머의 파티션이 옮겨 가기도 했다. 이 기본 클래식 프로토콜 재할당에서는 파티션이 그대로인 컨슈머도 `onPartitionsRevoked` 콜백을 받았다. `group.id`가 다른 컨슈머 둘은 같은 토픽을 각각 오프셋 0부터 읽었다. 단일 토픽에서 본 사례이며 문서의 유휴 서술과 맞았다.
Spring 리스너 컨테이너와 share group 서술은 실험하지 않았고 문서 서술에만 근거한다.
