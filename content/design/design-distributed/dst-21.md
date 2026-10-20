---
slug: "dst-21"
topic: "design-distributed"
tier: TRICKY
difficulty: 3
title: "Kafka는 exactly-once를 보장하나요? 보장 범위는 어디까지인가요?"
keywords: ["기본은 at-least-once", "멱등 프로듀서", "트랜잭션과 read_committed", "Kafka 안의 읽기-처리-쓰기", "외부 시스템은 별도 협조 필요"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://kafka.apache.org/41/design/design/", "https://kafka.apache.org/41/getting-started/introduction/", "https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf"]
concepts: [messaging, idempotency]
importance: 2
links: [{to: "dst-17", kind: PREREQ}, {to: "dst-07", kind: PREREQ}]
refs: ["Kleppmann, Distributed Systems lecture notes (Cambridge, 2021/22), PDF p.48"]
---
**모범 답변 (30~60초)**
Kafka의 기본 보장은 at-least-once입니다. 프로듀서가 응답을 받지 못하면 재전송하므로 중복이 생길 수 있고, 컨슈머도 처리한 뒤 오프셋을 저장하기 전에 죽으면 같은 메시지를 다시 받습니다. 0.11부터는 멱등 프로듀서 옵션이 있어 프로듀서 ID와 시퀀스 번호로 재전송이 로그에 중복 기록되지 않게 하고, 트랜잭션으로 여러 파티션에 원자적으로 쓰면서 컨슈머 오프셋도 같은 트랜잭션에 넣을 수 있습니다. 컨슈머가 `read_committed`로 읽으면 Kafka 토픽을 읽고 처리해 다른 토픽에 쓰는 흐름에서는 exactly-once가 가능하다고 문서가 설명합니다. 하지만 외부 DB 같은 다른 시스템에 쓰는 경우에는 그 시스템과의 협조가 필요해서, 보통은 소비자 쪽 멱등 처리를 함께 둡니다.

(공식 문서) Kafka Design 문서(4.1)의 "Message Delivery Semantics"는 at most once, at least once, exactly once를 구분하고, 많은 시스템의 exactly-once 주장은 소비자·생산자 실패나 다중 소비자 같은 경우에 해당하지 않을 수 있어 세부 조건을 읽어야 한다고 경고한다. 0.11.0.0 이전에는 응답을 못 받은 프로듀서가 재전송해 at-least-once였고, 이후 멱등 전송 옵션(프로듀서 ID와 시퀀스 번호로 브로커가 중복 제거)과 여러 토픽 파티션에 원자적으로 쓰는 트랜잭션이 생겼다고 한다. 소비자가 처리 후 위치를 저장하면 크래시 시 일부를 다시 처리하는 at-least-once이고, 많은 경우 메시지에 기본 키가 있어 갱신이 멱등이라고 쓴다. Kafka 토픽을 읽어 다른 토픽에 쓰는 경우(Kafka Streams 등)에는 오프셋을 출력과 같은 트랜잭션으로 기록하고 `read_committed` 격리 수준으로 읽으면 exactly-once가 되지만(기본 `read_uncommitted`는 중단된 트랜잭션의 메시지도 보임), 다른 대상 시스템에 대한 exactly-once는 그 시스템과의 협조가 필요하고 Kafka는 그것을 가능하게 하는 기본 요소(primitive)를 제공한다고 한다. 그렇지 않으면 기본은 at-least-once이며, 프로듀서 재시도를 끄고 처리 전에 오프셋을 커밋하면 at-most-once가 된다.
(원저자 자료) Kleppmann의 Cambridge 강의 노트(PDF 48쪽)는 exactly-once를 재시도에 멱등성 또는 중복 제거를 더한 것으로 정리한다.
