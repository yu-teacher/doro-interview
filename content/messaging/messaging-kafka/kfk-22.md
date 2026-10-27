---
slug: "kfk-22"
topic: "messaging-kafka"
tier: TRICKY
difficulty: 3
title: "`@Transactional` 안에서 DB에 저장하고 `KafkaTemplate`으로 메시지를 발행하면 둘이 원자적으로 처리되나요?"
keywords: ["DB와 Kafka는 별개의 트랜잭션", "DB 커밋 뒤 Kafka 커밋", "transactionIdPrefix 필요", "Kafka 커밋 실패는 예외로 전파", "보상 처리 필요"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-kafka/reference/kafka/transactions.html"]
concepts: [distributed-consistency, tx-boundary]
importance: 2
links: [{to: "kfk-15", kind: PREREQ}, {to: "dst-11", kind: RELATED}, {to: "tx-19", kind: RELATED}, {to: "tx-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. 두 자원의 트랜잭션이 동기화될 뿐 하나의 분산 트랜잭션이 아닙니다. 프로듀서 팩토리에 `transactionIdPrefix`를 주고 `@Transactional`을 쓰면 `KafkaTemplate`의 전송이 그 트랜잭션에 참여하고, 메서드가 끝나면 DB 트랜잭션이 먼저 커밋된 뒤 Kafka 트랜잭션이 커밋됩니다. 그래서 DB 커밋은 성공했는데 Kafka 커밋이 실패하는 틈이 있고, 그 예외는 호출자에게 던져지므로 애플리케이션이 보상 처리를 해야 합니다. 순서를 뒤집어 Kafka를 먼저 커밋하려면 바깥 메서드를 DB, 안쪽 메서드를 Kafka 트랜잭션 매니저로 중첩합니다. 이 틈 자체를 없애려면 아웃박스 같은 별도 패턴이 필요합니다.

(공식 문서) Spring for Apache Kafka 레퍼런스(현행 4.1.2)의 Transactions 절은 `DefaultKafkaProducerFactory`에 `transactionIdPrefix`를 주면 트랜잭션 프로듀서를 캐시로 관리한다고 한다. Transaction Synchronization 절은 `@Transactional` 메서드에서 `KafkaTemplate` 전송이 `DataSourceTransactionManager` 같은 트랜잭션에 동기화되고, 메서드가 끝나면 데이터베이스 트랜잭션이 먼저 커밋된 뒤 Kafka 트랜잭션이 커밋된다고 설명한다. Kafka를 먼저 커밋하려면 바깥 메서드를 `DataSourceTransactionManager`, 안쪽 메서드를 `KafkaTransactionManager`로 설정한 중첩 `@Transactional`을 쓰라고 한다.
(공식 문서) 같은 절은 주 트랜잭션이 커밋된 뒤 동기화된 트랜잭션의 커밋이 실패하면 예외가 호출자에게 던져지며(2.5.17 등 이후, 이전에는 디버그 로그만 남았다), 애플리케이션이 필요하면 이미 커밋된 주 트랜잭션을 보상해야 한다고 한다.
(보충) 두 트랜잭션이 "하나의 분산 트랜잭션이 아니다"라는 표현은 위 커밋 순서와 보상 서술에서 이끌어 낸 요약이며 문서가 이렇게 명시한 것은 아니다. 이 틈을 없애는 수단으로 아웃박스 패턴을 든 것도 일반적으로 알려진 설명이며 이번에 읽은 Spring Kafka 문서에서 확인한 것은 아니다.
Spring Kafka 라이브러리를 쓸 수 없는 환경이라 리스너·재시도·트랜잭션 동작은 실험하지 않았고, 위 내용은 문서 서술에만 근거한다.
