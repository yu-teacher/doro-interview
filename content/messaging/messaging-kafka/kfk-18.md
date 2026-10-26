---
slug: "kfk-18"
topic: "messaging-kafka"
tier: TRICKY
difficulty: 3
title: "토픽의 파티션 수를 나중에 늘리면 어떤 문제가 생기나요? 줄일 수도 있나요?"
keywords: ["키 해시 매핑 변경", "키 순서 보장이 깨질 수 있음", "auto.offset.reset=latest 유실", "파티션 축소 미지원", "내부 토픽 파티션 변경 금지"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/operations/basic-kafka-operations/", "https://kafka.apache.org/43/configuration/consumer-configs/"]
concepts: [partition-consumer-group]
importance: 1
links: [{to: "kfk-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
파티션은 `kafka-topics.sh --alter --partitions`로 늘릴 수 있지만 부작용이 있습니다. 키의 해시를 파티션 수로 나눠 매핑하는 기본 방식이면 수가 바뀔 때 같은 키가 다른 파티션으로 갈 수 있어 기존 키의 순서 보장이 깨질 수 있고, Kafka가 기존 데이터를 다시 나눠 주지도 않습니다. 컨슈머가 `auto.offset.reset=latest`이면 새 파티션을 발견하기 전에 쓰인 메시지를 놓칠 수 있고, 메타데이터 갱신 지연 때문에 클라이언트가 새 파티션을 늦게 알아차립니다. 파티션 수를 줄이는 것은 지원되지 않고, `__consumer_offsets` 같은 내부 토픽의 파티션은 늘려도 안 됩니다.

(공식 문서) Basic Kafka Operations 문서(4.3)의 Modifying topics 절은 파티션 수를 동적으로 늘릴 때 `hash(key) % number_of_partitions`로 나누는 기본 파티셔너의 매핑이 바뀌어 같은 키의 메시지가 다른 파티션으로 가고 순서 보장에 영향을 줄 수 있으며 기존 데이터를 자동으로 재분배하지 않는다고 설명한다. `auto.offset.reset=latest`인 컨슈머는 파티션 생성과 발견 사이에 새 파티션으로 간 메시지를 놓칠 수 있고, 새 파티션은 `metadata.max.age.ms` 간격의 메타데이터 갱신 전에는 클라이언트에 보이지 않는다고 한다.
(공식 문서) 같은 절은 `__consumer_offsets`, `__transaction_state` 등 내부 상태 토픽의 파티션을 수동으로 늘리면 코디네이터 매핑이 깨져 데이터 손상을 부를 수 있다고 경고하고, Kafka는 현재 토픽의 파티션 수 감소를 지원하지 않는다고 명시한다. 컨슈머 설정 문서의 `auto.offset.reset` 항목에도 같은 유실 위험이 적혀 있다.
(보충) 파티션 수를 처음부터 여유 있게 잡으라는 조언은 축소가 불가능하다는 사실에서 이어지는 실무 권고다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): 파티션 3개 토픽에 키 a~d를 쓴 뒤(a·c는 파티션 1, b·d는 파티션 2) `kafka-topics.sh --alter --partitions 5`로 늘리고 같은 키로 한 번 더 쓰니 a·c는 파티션 4, b는 파티션 1, d는 파티션 3으로 갔다. 같은 키가 다른 파티션으로 가서 이전 레코드와 한 파티션에 쌓이지 않았고 기존 레코드도 옮겨지지 않았다. 5개를 2개로 줄이려 하자 `InvalidPartitionsException`(현재 5개이고 2는 증가가 아님)으로 거부됐다.
(실험 확인) kafka-clients 4.3.1(Corretto 21) 컨슈머를 `auto.offset.reset=latest`, `metadata.max.age.ms=10000`으로 파티션 1개 토픽에 붙인 뒤 2개로 늘리고 곧바로 새 파티션 1에 `early`를 쓰고, 컨슈머가 새 파티션을 할당받은 뒤(늘린 지 약 4초 뒤, `revoked`와 `assigned [0, 1]` 순) `late`를 쓰니 컨슈머는 `late`(파티션 1 오프셋 1)만 받았고 `early`(오프셋 0)는 받지 못했다. 기본 `metadata.max.age.ms`는 5분이라 실제 지연은 더 길 수 있으며 이 값은 시험하지 않았다. `__consumer_offsets` 같은 내부 토픽의 파티션을 늘리는 것은 브로커를 망가뜨릴 수 있어 시도하지 않았다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
