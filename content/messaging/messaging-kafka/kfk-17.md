---
slug: "kfk-17"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "Spring Kafka 컨테이너는 오프셋을 언제 커밋하나요? `AckMode`의 종류와 기본값은 무엇인가요?"
keywords: ["기본 AckMode BATCH", "RECORD는 레코드마다 커밋", "TIME·COUNT 조건 커밋", "MANUAL과 Acknowledgment", "enable.auto.commit을 false로 설정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html", "https://docs.spring.io/spring-kafka/reference/kafka/container-props.html"]
concepts: [delivery-guarantee]
importance: 2
links: [{to: "rmq-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
컨테이너는 자체 커밋 방식을 가져서, `enable.auto.commit`을 명시하지 않으면 2.3부터 false로 둡니다. 기본 `AckMode`는 `BATCH`로, `poll`이 돌려준 레코드를 모두 처리한 뒤 커밋합니다. `RECORD`는 레코드 하나의 처리가 끝날 때마다 커밋하고, `TIME`과 `COUNT`는 `poll` 결과를 다 처리한 뒤 시간이나 개수 조건이 차면 커밋하며, `COUNT_TIME`은 둘 중 하나만 차도 커밋합니다. `MANUAL`은 리스너가 `Acknowledgment.acknowledge()`를 호출해야 하고 호출 뒤의 의미는 `BATCH`와 같으며, `MANUAL_IMMEDIATE`는 호출 즉시 커밋합니다. 트랜잭션을 쓰면 오프셋이 트랜잭션에 실립니다.

(공식 문서) Spring for Apache Kafka 레퍼런스(현행 4.1.2)의 Message Listener Containers 문서 Committing Offsets 절은 `enable.auto.commit`이 false면 컨테이너가 여러 `AckMode`를 지원하고 기본이 `BATCH`라고 한다. 각 모드의 동작은 `RECORD`, `BATCH`, `TIME`, `COUNT`, `COUNT_TIME`, `MANUAL`, `MANUAL_IMMEDIATE` 순으로 위 설명과 같고, 2.3부터 프레임워크가 명시 설정이 없으면 `enable.auto.commit`을 false로 둔다고 한다. 트랜잭션 사용 시에는 오프셋이 트랜잭션에 전달되며 리스너 종류에 따라 `RECORD` 또는 `BATCH`와 같은 의미라고 한다. 컨테이너 속성 표에도 `ackMode` 기본값이 `BATCH`로 적혀 있다.
Spring Kafka 라이브러리를 쓸 수 없는 환경이라 리스너·재시도·트랜잭션 동작은 실험하지 않았고, 위 내용은 문서 서술에만 근거한다.
