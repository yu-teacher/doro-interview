---
slug: "rmq-21"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 3
title: "메시지가 중복 전달될 수 있다면 컨슈머를 어떻게 멱등하게 설계하나요?"
keywords: ["재전달로 중복 처리 가능", "메시지 고유 ID", "처리한 ID 기록 후 중복은 건너뜀", "ack는 처리 후", "ack를 몰아 보내면 재전달 증가"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-two-java", "https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html", "https://docs.spring.io/spring-amqp/reference/amqp/containerAttributes.html", "https://docs.spring.io/spring-amqp/reference/amqp/transactions.html"]
concepts: [idempotency, delivery-guarantee]
importance: 3
links: [{to: "dst-07", kind: RELATED}, {to: "dst-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
ack를 처리가 끝난 뒤에 보내는 구조에서는 컨슈머가 ack 전에 죽거나 연결이 끊기면 브로커가 메시지를 다시 보내므로, 같은 메시지가 두 번 이상 도착할 수 있다고 보고 설계해야 합니다. 발신 측이 메시지마다 고유한 ID, 예를 들어 `messageId`를 붙이고, 컨슈머는 처리한 ID를 저장소에 기록하면서 이미 있으면 건너뜁니다. 이 확인과 업무 처리를 같은 DB 트랜잭션으로 묶으면 둘이 함께 성공하거나 실패합니다. 처리 자체를 결과가 같은 연산, 예를 들어 upsert나 상태 값 설정으로 만드는 방법도 있습니다. 한편 `messagesPerAck`처럼 ack를 몰아 보내는 설정은 재전달될 가능성을 키웁니다.

(공식 문서) 튜토리얼 2는 ack 없이 연결이 닫히면 브로커가 메시지를 재큐잉하고 재전달한다고 한다. Spring AMQP 복원력 문서는 stateful 재시도에 메시지를 고유하게 식별할 값이 필요하며 발신 측이 `MessageId`를 넣는 것이 가장 단순하다고 한다. 컨테이너 속성 문서는 `messagesPerAck`가 ack 수를 줄이는 대신 재전달될 가능성을 높인다고 설명한다. 트랜잭션 문서는 `channelTransacted`와 외부 트랜잭션으로 DB 작업과 메시지 확인을 묶는 방법을 설명한다(rmq-22).
(보충) 처리 이력 테이블, 고유 ID 중복 검사, upsert 같은 멱등 소비 설계 자체는 일반적인 실무 설명이며 위 문서가 구체적으로 규정한 방식이 아니다. 문서 근거는 재전달이 일어난다는 점과 메시지 ID 필요성까지다.
(실험 확인) RabbitMQ 4.4.0에서 수동 ack 컨슈머가 ack 전에 연결을 끊으면 같은 메시지가 `redelivered` true로 다시 전달됐다(rmq-06). 메시지 5건 중 3번째 delivery tag에 `multiple=true`로 ack한 뒤 연결을 끊자 1~3번은 확정되고 ack되지 않은 4·5번만 재전달됐다. 즉 ack를 몰아 보낼수록 마지막 ack 이후 처리분이 장애 시 다시 오는 범위가 넓어진다는 방향은 브로커 수준에서 확인했다. `messagesPerAck` 설정 자체와 `messageId` 기반 중복 검사 설계는 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 일반 설계).
