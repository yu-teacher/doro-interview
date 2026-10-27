---
slug: "kfk-20"
topic: "messaging-kafka"
tier: TRICKY
difficulty: 3
title: "컨슈머가 메시지 처리에 오래 걸리면 어떤 일이 생기고, `max.poll.interval.ms`와 `max.poll.records`로 어떻게 대응하나요?"
keywords: ["poll 호출 간격의 상한", "초과하면 그룹에서 이탈", "CommitFailedException", "max.poll.records로 한 번에 받는 양 축소", "별도 스레드 처리와 파티션 pause"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html", "https://kafka.apache.org/43/configuration/consumer-configs/"]
concepts: [partition-consumer-group, delivery-guarantee]
importance: 2
links: [{to: "kfk-13", kind: PREREQ}]
---
**모범 답변 (30~60초)**
컨슈머는 `poll`을 부르는 것 자체가 생존 신호라서, 하트비트가 계속 나가도 `poll` 호출 간격이 `max.poll.interval.ms`(기본 5분)를 넘으면 클라이언트가 스스로 그룹을 떠나 파티션이 다른 컨슈머에게 넘어갑니다. 그 뒤 원래 컨슈머가 오프셋을 커밋하려 하면 `CommitFailedException`이 날 수 있고, 커밋하지 못한 레코드는 새 담당자가 다시 받아 중복될 수 있습니다. 대응은 `max.poll.records`(기본 500)를 줄여 한 번에 받는 양을 줄이거나 간격을 늘리는 것이고, 처리 시간이 예측 불가하면 문서는 처리를 다른 스레드로 옮기고 파티션을 일시 정지하며 처리가 끝난 뒤에만 커밋하라고 권장합니다.

(공식 문서) KafkaConsumer Javadoc의 Detecting Consumer Failures 절은 `poll`이 컨슈머 생존을 보장하는 설계이고, 하트비트가 가도 진척이 없는 라이브락을 막으려고 `poll` 간격이 `max.poll.interval.ms`를 넘기면 클라이언트가 그룹을 떠나 다른 컨슈머가 파티션을 맡으며, 이때 `commitSync`에서 `CommitFailedException`이 날 수 있다고 설명한다. `max.poll.interval.ms`를 늘리면 처리 시간을 벌지만 리밸런스가 지연될 수 있고, `max.poll.records`를 줄이면 한 번의 처리량을 예측하기 쉬워진다고 한다. 처리 시간이 예측 불가한 경우 권장 방법은 처리를 다른 스레드로 옮기고, 자동 커밋을 끄고, 스레드가 끝낸 뒤에만 오프셋을 커밋하며, 그동안 파티션을 pause하는 것이라고 한다.
(공식 문서) 컨슈머 설정 문서는 `max.poll.interval.ms` 기본값이 300000(5분), `max.poll.records` 기본값이 500이라고 하고, `max.poll.records`는 내부 fetch 동작에는 영향이 없다고 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 설정 클래스의 기본값은 `max.poll.interval.ms=300000`, `max.poll.records=500`이었다. 컨슈머 A(`max.poll.interval.ms=3000`, `max.poll.records=5`, 자동 커밋 끔)가 오프셋 0~4를 받고 처리에 약 7초를 쓰는 동안 같은 그룹의 컨슈머 B가 들어오자, A의 `kafka-coordinator-heartbeat-thread`가 `consumer poll timeout has expired`(max.poll.interval.ms 초과) 경고와 함께 스스로 `LeaveGroup`을 보냈다(하트비트 스레드는 살아 있었다). B는 파티션을 받아 A가 받았던 오프셋 0부터 5개를 다시 받았고 커밋했다.
(실험 확인) 이어서 A가 `commitSync()`를 부르자 `CommitFailedException`(consumer is not part of an active group ... it is likely that the consumer was kicked out of the group)이 났고 A의 다음 `poll`은 레코드 0개, 할당 빈 집합이었다. 재검증에서는 다음 `poll`에서 A가 그룹에 다시 들어와 파티션을 받기도 했고, 다른 컨슈머가 없을 때는 A가 오프셋 0부터 같은 5개를 다시 받았다. 그 뒤 상태는 타이밍에 따라 달랐다. 커밋하지 못한 레코드가 새 담당자에게 중복 전달된다는 해석이 이 시험으로 확인됐다. 처리를 별도 스레드로 옮기고 파티션을 `pause`하는 권장 방법은 시험하지 않았다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
