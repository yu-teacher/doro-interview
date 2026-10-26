---
slug: "kfk-07"
topic: "messaging-kafka"
tier: BASIC
difficulty: 1
title: "컨슈머 랙(lag)이란 무엇이고, 어떻게 확인하나요?"
keywords: ["로그 끝에서 뒤처진 정도", "kafka-consumer-groups.sh --describe", "파티션별 CURRENT-OFFSET과 LOG-END-OFFSET", "랙 증가는 소비 지연", "컨슈머 그룹 단위"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/operations/basic-kafka-operations/", "https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html"]
concepts: [partition-consumer-group, observability]
importance: 2
links: [{to: "kfk-20", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
랙은 컨슈머 그룹이 파티션의 로그 끝에서 얼마나 뒤처져 있는지를 나타냅니다. 운영 문서의 `kafka-consumer-groups.sh --describe --group 그룹명` 명령은 파티션별로 `CURRENT-OFFSET`, `LOG-END-OFFSET`, `LAG` 열을 보여 주고, 문서의 출력 예에서 `LAG`은 로그 끝 오프셋에서 현재 오프셋을 뺀 값과 같습니다. 랙이 계속 커지면 프로듀서가 쓰는 속도를 컨슈머가 따라가지 못한다는 신호라서, 처리 로직을 점검하거나 컨슈머를 늘립니다. 다만 컨슈머를 늘려도 파티션 수를 넘으면 더 병렬화되지 않습니다. 그룹과 파티션마다 값이 달라서 한 파티션만 뒤처지는 경우도 이 표로 찾을 수 있습니다.

(공식 문서) Basic Kafka Operations 문서(4.3)의 Checking consumer position 절은 그룹 내 모든 컨슈머의 위치와 로그 끝에서 얼마나 뒤처졌는지를 보여 주는 도구가 있다고 하며, `kafka-consumer-groups.sh --describe --group my-group` 명령과 `TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID` 열을 가진 출력 예를 보여 준다. 예의 첫 행은 `CURRENT-OFFSET` 2, `LOG-END-OFFSET` 4, `LAG` 2이고 다른 행들도 로그 끝 오프셋에서 현재 오프셋을 뺀 값이 `LAG`과 같다(표를 보고 계산해 확인했고, 문서가 뺄셈이라고 명시한 것은 아니다).
(보충) 랙이 늘 때 컨슈머를 늘리거나 처리 로직을 점검한다는 대응은 일반적인 운영 상식이다. 파티션 수를 넘는 증설이 소용없다는 말은 컨슈머 그룹 문서의 파티션 할당 규칙에서 나오며, 컨슈머가 파티션보다 많을 때 빈 할당을 받는 컨슈머가 생긴다는 것은 다른 질문의 실험으로 확인했다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): 파티션 3개 토픽에 키 없는 메시지 30개를 쓰자 이 환경에서는 모두 파티션 2에 들어갔다. 콘솔 컨슈머가 12개만 읽고 끝난 뒤 `kafka-consumer-groups.sh --describe --group 그룹명`은 멤버가 없다는 안내와 함께 `GROUP TOPIC PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG CONSUMER-ID HOST CLIENT-ID` 열을 보여 줬고, 파티션 2는 CURRENT-OFFSET 12, LOG-END-OFFSET 30, LAG 18, 나머지 파티션은 0이었으며 `CONSUMER-ID` 등은 `-`였다. `--state`로는 멤버 0명인 `Empty` 상태가 나왔다.
(실험 확인) 같은 환경에서 kafka-clients 4.3.1(Corretto 21) 컨슈머가 10개짜리 단일 파티션에서 4개를 읽어 커밋하고 살아 있는 동안 `--describe`를 하니 CURRENT-OFFSET 4, LOG-END-OFFSET 10, LAG 6이었고 `CONSUMER-ID`, `HOST`(`/127.0.0.1`), `CLIENT-ID`가 채워져 있었다. 두 경우 모두 `LAG`은 로그 끝 오프셋에서 현재 오프셋을 뺀 값이었고, 이로써 문서가 명시하지 않은 뺄셈 관계를 실제 출력으로 확인했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
