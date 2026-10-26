---
slug: "kfk-02"
topic: "messaging-kafka"
tier: BASIC
difficulty: 1
title: "Kafka의 오프셋은 무엇이고, 컨슈머의 현재 위치(position)와 커밋된 오프셋(committed)은 어떻게 다른가요?"
keywords: ["파티션 안의 레코드 번호", "다음에 읽을 위치", "position과 committed 구분", "재시작하면 커밋된 오프셋부터", "내부 토픽에 저장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html", "https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/operations/basic-kafka-operations/", "https://kafka.apache.org/43/configuration/broker-configs/"]
concepts: [partition-consumer-group, delivery-guarantee]
importance: 3
links: [{to: "kfk-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
오프셋은 파티션 안에서 레코드마다 붙는 번호로, 그 파티션 안에서 레코드를 식별하고 컨슈머의 읽기 위치를 나타냅니다. 위치(position)는 다음에 받을 레코드의 오프셋이고, `poll`로 레코드를 받을 때마다 자동으로 앞으로 갑니다. 커밋된 오프셋은 Kafka 내부 토픽에 메시지로 안전하게 저장해 둔 위치로, 컨슈머가 죽었다 다시 시작하거나 다른 컨슈머가 파티션을 넘겨받으면 여기서부터 읽습니다. 그래서 커밋된 오프셋과 위치 사이의 레코드는 장애 때 다시 전달될 수 있습니다. 커밋하는 값은 마지막으로 처리한 오프셋이 아니라 다음에 읽을 오프셋입니다.

(공식 문서) KafkaConsumer Javadoc(4.3)는 오프셋을 파티션 안에서 레코드를 식별하는 번호이자 컨슈머의 위치라고 설명한다. 위치는 다음에 줄 레코드의 오프셋으로 `poll`을 받을 때마다 자동으로 진행되고, 커밋된 위치는 안전하게 저장된 마지막 오프셋으로 프로세스가 재시작하면 여기로 복구된다고 한다. 커밋하는 값은 항상 다음에 읽을 메시지의 오프셋이어야 한다고 적혀 있고, 압축된 토픽이나 트랜잭션으로 쓴 레코드에서는 오프셋이 연속이 아닐 수 있다고도 한다.
(공식 문서) Design 문서는 컨슈머의 위치가 내부 토픽에 메시지로 저장된다고 설명하고, 브로커 설정 문서(4.3)는 오프셋 커밋이 "offsets topic"의 복제본에 반영될 때까지 지연된다는 설정(`offsets.commit.timeout.ms`)을 둔다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 오프셋 0~9가 든 단일 파티션을 `max.poll.records=5`, 자동 커밋 끔으로 `poll`하자 첫 레코드 오프셋은 0, `position`은 5, `committed`는 null이었고, `commitSync()` 뒤 `committed`는 오프셋 5였다. 같은 그룹으로 다시 시작하면 오프셋 5부터 받았다. 마지막으로 처리한 오프셋 9를 그대로 커밋하고 다시 시작하니 오프셋 9를 한 번 더 받아서, 커밋 값은 다음에 읽을 오프셋이어야 한다는 설명과 맞았다.
(실험 확인) 같은 환경에서 `__consumer_offsets`는 파티션 50개, `cleanup.policy=compact`인 토픽이었다. 그룹 ID가 해시로 배정된 파티션의 로그를 `kafka-dump-log.sh --offsets-decoder`로 보니 키가 그룹·토픽·파티션이고 값의 offset 필드가 5인 커밋 메시지가 들어 있었다. 오프셋 커밋이 이 이름의 내부 토픽에 메시지로 저장된다는 연결이 이로써 확인됐다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
