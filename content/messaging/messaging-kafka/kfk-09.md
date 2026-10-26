---
slug: "kfk-09"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "자동 커밋과 수동 커밋은 어떻게 다르고, 오프셋 커밋 시점에 따라 at-most-once와 at-least-once는 어떻게 갈리나요?"
keywords: ["enable.auto.commit 기본 true", "처리 후 커밋은 at-least-once", "커밋 후 처리는 at-most-once", "커밋과 처리 사이의 장애", "수동 커밋 commitSync"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/configuration/consumer-configs/", "https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html"]
concepts: [delivery-guarantee]
importance: 3
links: [{to: "kfk-10", kind: FOLLOWUP}, {to: "kfk-17", kind: FOLLOWUP}, {to: "dst-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
`enable.auto.commit`의 기본값은 true라서 `auto.commit.interval.ms`(기본 5초)마다 백그라운드로 오프셋을 커밋합니다. 의미는 커밋과 처리의 순서로 갈립니다. 위치를 먼저 저장하고 처리하면 저장 직후 죽을 때 처리하지 못한 메시지가 건너뛰어져 at-most-once이고, 처리한 뒤 위치를 저장하면 처리 직후 죽을 때 같은 메시지를 다시 받아 at-least-once입니다. 문서는 수동 커밋을 처리 뒤에 하면 at-least-once라고 하고, 자동 커밋도 다음 `poll` 전에 받은 레코드를 모두 처리해야 안전하다고 설명합니다. 중복이 와도 결과가 같게 소비 로직을 멱등으로 만드는 것이 일반적입니다.

(공식 문서) 컨슈머 설정 문서(4.3)는 `enable.auto.commit` 기본값이 true이고 `auto.commit.interval.ms` 기본값이 5000(5초)이라고 한다. Design 문서의 Message Delivery Semantics 절은 위치를 먼저 저장하고 처리하면 처리 못 한 메시지가 생길 수 있어 at-most-once, 처리 후 위치를 저장하면 위치 저장 전 크래시 때 이미 처리한 메시지를 다시 받으므로 at-least-once라고 설명한다. 프로듀서 재시도를 끄고 처리 전에 커밋하면 at-most-once를 구현할 수 있다고도 한다.
(공식 문서) KafkaConsumer Javadoc의 Manual Offset Control 절은 처리 뒤에 `commitSync`를 부르는 예를 들며 이것이 at-least-once이고, 자동 커밋도 다음 `poll` 전이나 닫기 전에 이전 `poll`의 데이터를 모두 소비해야 at-least-once이며 그러지 않으면 커밋된 오프셋이 소비 위치를 앞질러 레코드를 놓칠 수 있다고 설명한다.
(보충) 중복에 대비해 소비 로직을 멱등하게 만드는 것이 일반적이라는 말은 문서의 서술을 바탕으로 한 흔한 실무 관행이다. Design 문서도 키가 있는 메시지는 갱신이 멱등일 수 있다는 점을 언급한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 설정 클래스의 기본값은 `enable.auto.commit=true`, `auto.commit.interval.ms=5000`이었다. 자동 커밋 컨슈머(`max.poll.records=3`)는 첫 `poll` 직후와 5초 안의 두 번째 `poll` 뒤에는 `committed`가 null이었고, 5.5초를 기다린 뒤 세 번째 `poll`에서야 커밋이 나타났으며 값은 6(그 `poll` 직전의 위치)이었다. `close()` 뒤 같은 그룹으로 다시 시작하니 마지막 위치 9부터 받았다. 수동 커밋 컨슈머는 `commitSync()` 전에 `committed`가 null이었다. 커밋과 처리 사이에 프로세스가 죽는 시나리오는 장애를 주입하지 않아 재현하지 못했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
