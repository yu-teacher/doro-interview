---
slug: "rmq-11"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 2
title: "Spring AMQP 리스너 컨테이너의 AcknowledgeMode NONE, AUTO, MANUAL은 각각 무엇이고 기본값은 무엇인가요?"
keywords: ["NONE은 autoack", "AUTO는 예외 없으면 컨테이너가 ack", "MANUAL은 basicAck 직접 호출", "기본값 AUTO"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/containerAttributes.html", "https://docs.spring.io/spring-amqp/reference/amqp/transactions.html"]
concepts: [delivery-guarantee]
importance: 2
links: [{to: "rmq-12", kind: FOLLOWUP}, {to: "rmq-16", kind: FOLLOWUP}, {to: "rmq-06", kind: PREREQ}, {to: "kfk-17", kind: RELATED}]
---
**모범 답변 (30~60초)**
`NONE`은 ack를 보내지 않는 모드로, RabbitMQ 용어로는 autoack이라 브로커가 전달한 즉시 처리된 것으로 간주합니다. `MANUAL`은 리스너가 `Channel.basicAck()`를 직접 호출해야 합니다. `AUTO`는 컨테이너가 알아서 ack하되 리스너가 예외를 던지면 ack하지 않으며, 이것이 기본값입니다. `NONE`에서는 프리페치 설정이 무시되고 트랜잭션 채널과도 함께 쓸 수 없습니다. `MANUAL`에서 ack를 빠뜨리면 메시지가 unacked로 남으니 처리 완료 시점을 직접 정해야 할 때만 쓰는 편이 안전합니다.

(공식 문서) 컨테이너 속성 문서는 `acknowledgeMode`의 `NONE`은 ack를 보내지 않으며 RabbitMQ가 autoack이라 부르고 `channelTransacted=true`와 호환되지 않는다고 설명한다. `MANUAL`은 리스너가 `Channel.basicAck()`를 호출해야 하고, `AUTO`는 리스너가 예외를 던지지 않는 한 컨테이너가 자동 ack하며 이것이 기본 모드라고 한다. `prefetchCount`는 `acknowledgeMode`가 `NONE`이면 무시된다고 한다.
(공식 문서) 튜토리얼 2는 ack를 잊는 것이 흔한 실수이며 브로커가 미확인 메시지를 해제하지 못해 메모리를 점점 더 쓴다고 경고한다.
(보충) 'MANUAL은 필요할 때만 쓰는 편이 안전하다'는 권고는 일반적인 실무 의견이며 문서의 권고가 아니다.
(실험 확인) RabbitMQ 4.4.0 브로커 수준에서 확인했다. 자동 ack(no-ack) 컨슈머는 `basic.qos` 프리페치 3을 줬어도 큐에 있던 10건을 모두 받았다(프리페치 무시). 수동 ack 컨슈머가 ack 없이 3건을 쥐고 있으면 관리 API에서 unacked 3으로 남았다. Spring의 `acknowledgeMode` `AUTO`·`MANUAL` 동작과 기본값은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
