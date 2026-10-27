---
slug: "kfk-13"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "컨슈머 그룹 리밸런싱은 언제 일어나고, 왜 문제가 되며, 어떻게 줄일 수 있나요?"
keywords: ["멤버 변화와 파티션 추가로 발생", "session.timeout.ms와 하트비트", "max.poll.interval.ms", "정적 멤버십 group.instance.id", "KIP-848 새 컨슈머 프로토콜"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html", "https://kafka.apache.org/43/configuration/consumer-configs/", "https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/operations/consumer-rebalance-protocol/"]
concepts: [partition-consumer-group]
importance: 2
---
**모범 답변 (30~60초)**
리밸런싱은 그룹이 파티션을 컨슈머에게 다시 나누는 일로, 컨슈머가 들어오거나 나가거나 죽을 때, 구독 토픽에 파티션이 추가되거나 정규식에 맞는 토픽이 생길 때 일어납니다. 기존(classic) 프로토콜에서는 컨슈머가 `session.timeout.ms`(기본 45초) 동안 하트비트를 못 보내거나 `max.poll.interval.ms`(기본 5분) 안에 `poll`을 다시 부르지 못하면 죽은 것으로 보고 파티션을 회수합니다. 재시작이나 배포 때마다 파티션이 뒤섞여 상태 복구가 길어지는 것을 줄이려면 `group.instance.id`로 정적 멤버십을 쓰고 세션 타임아웃을 늘립니다. Kafka 4.0부터는 전역 동기화 장벽이 없는 점진적 새 프로토콜(KIP-848)이 정식이며, 컨슈머에서 `group.protocol=consumer`로 켭니다.

(공식 문서) KafkaConsumer Javadoc은 멤버가 실패하거나 새로 들어오면 파티션이 재할당되는 것을 리밸런싱이라 하고, 구독 토픽에 파티션이 추가되거나 정규식에 맞는 새 토픽이 생길 때도 일어난다고 설명한다. `session.timeout.ms` 동안 하트비트가 없으면 죽은 것으로 보며, `poll` 간격이 `max.poll.interval.ms`를 넘으면 클라이언트가 스스로 그룹을 떠난다고 한다. 컨슈머 설정 문서는 `session.timeout.ms` 기본 45초, `heartbeat.interval.ms` 기본 3초, `max.poll.interval.ms` 기본 5분이라고 한다.
(공식 문서) Design 문서의 Static Membership 절은 동적 멤버십에서는 재시작할 때마다 멤버 ID가 바뀌어 작업이 다른 인스턴스로 대량 재배치될 수 있고 상태가 큰 앱은 복구가 오래 걸리므로, `group.instance.id`로 영속 ID를 주면 리밸런스가 일어나지 않는다고 설명한다. Consumer Rebalance Protocol 문서는 4.0부터 KIP-848의 새 프로토콜이 GA이고 전역 동기화 장벽에 의존하지 않는 완전 점진적 설계라고 하며, 서버는 기본 활성이지만 컨슈머는 `group.protocol`을 `consumer`로 설정해야 켜지고 이때 하트비트·세션 타임아웃은 브로커 설정이 제어한다고 한다. 4.3 문서 기준 컨슈머 설정의 `group.protocol` 기본값은 `classic`이며, 새 프로토콜을 켜면 `heartbeat.interval.ms`, `session.timeout.ms`, `partition.assignment.strategy`는 쓸 수 없다고 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 설정 클래스의 기본값은 `session.timeout.ms=45000`, `heartbeat.interval.ms=3000`, `max.poll.interval.ms=300000`, `group.protocol=classic`이었고 브로커의 `group.consumer.session.timeout.ms=45000`, `group.consumer.heartbeat.interval.ms=5000`이었다. 기본 설정(클래식, 기본 할당기)에서 컨슈머 4개가 파티션 3개를 구독하다 하나를 닫자 남은 컨슈머가 모두 `onPartitionsRevoked`를 받은 뒤 다시 할당받았다.
(실험 확인) 같은 환경에서 컨슈머 둘에 `group.instance.id`를 주고 하나를 닫은 뒤 약 2초 만에 같은 ID로 다시 띄우니 같은 파티션(0, 1)을 다시 받았고 다른 컨슈머는 `revoked`·`assigned` 콜백을 받지 않았다. 같은 절차를 ID 없이 하면 남은 컨슈머가 `revoked` 뒤 전체 파티션을 받았다가 다시 나눠지는 두 번의 재할당을 겪었다.
(실험 확인) `group.protocol=consumer`로 `session.timeout.ms`, `heartbeat.interval.ms`, `partition.assignment.strategy`를 각각 설정하면 `ConfigException`(`... cannot be set when group.protocol=CONSUMER`)이 났다. 이 프로토콜의 컨슈머 4개와 파티션 3개에서 한 멤버가 나가자 이동하는 파티션만 바뀌고 나머지 컨슈머는 `revoked` 콜백을 받지 않았다. 그룹의 할당 방식은 `--describe --state`에서 `uniform`이었다. `session.timeout.ms` 초과로 죽은 판정이 나는 경우는 프로세스를 죽여 기다리지 않아 재현하지 못했다(`max.poll.interval.ms` 초과는 다른 질문에서 확인).
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
