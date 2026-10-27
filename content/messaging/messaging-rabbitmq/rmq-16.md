---
slug: "rmq-16"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 2
title: "컨슈머가 ack를 깜빡하거나 다른 채널로 ack하면 어떤 일이 생기나요?"
keywords: ["ack 누락 시 unacked 누적", "메모리 증가", "연결이 끊기면 재전달", "같은 채널에서만 ack", "전달 확인 타임아웃 기본 30분"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-two-java", "https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html"]
concepts: [delivery-guarantee]
importance: 1
links: [{to: "rmq-06", kind: PREREQ}, {to: "rmq-11", kind: PREREQ}]
---
**모범 답변 (30~60초)**
ack를 빠뜨려도 당장 에러는 나지 않지만 결과는 심각합니다. 브로커는 그 메시지를 unacked 상태로 계속 들고 있어 메모리를 해제하지 못하고, 컨슈머가 종료되거나 연결이 끊기면 무작위처럼 보이는 재전달이 생깁니다. ack는 메시지를 받은 바로 그 채널에서 보내야 하고, 다른 채널로 보내면 채널 수준 프로토콜 예외가 납니다. 또 전달 확인에는 기본 30분 타임아웃이 적용돼서 영원히 ack하지 않는 멈춘 컨슈머를 감지하는 데 쓰입니다. unacked 수는 `rabbitmqctl list_queues name messages_ready messages_unacknowledged`로 확인합니다.

(공식 문서) 튜토리얼 2는 `basicAck`를 빠뜨리는 것이 흔한 실수이고, 클라이언트가 종료될 때 재전달이 일어나 무작위처럼 보일 수 있으며 브로커가 미확인 메시지를 해제하지 못해 메모리를 점점 더 쓴다고 설명한다. 확인은 전달을 받은 같은 채널에서 보내야 하고 다른 채널로 하면 채널 수준 프로토콜 예외가 난다고 하며, 전달 확인 응답에는 기본 30분 타임아웃이 걸려 멈춘 컨슈머를 감지한다고 한다. 타임아웃이 지나면 구체적으로 무슨 일이 일어나는지는 문서 근거로는 다루지 않았고 아래 실험으로 확인했다.
(공식 문서) Spring AMQP 복원력 문서는 이미 settle된 전달을 다시 settle하면 프로토콜 위반으로 브로커가 `PRECONDITION_FAILED - unknown delivery tag`로 응답하고 채널 전체를 닫아 그 채널의 다른 진행 작업까지 실패한다고 경고한다.
(실험 확인) RabbitMQ 4.4.0에서 수동 ack 컨슈머가 ack 없이 3건을 쥐고 있을 때 관리 API와 `rabbitmqctl list_queues -p <vhost> name messages_ready messages_unacknowledged`에서 ready 0, unacked 3으로 보였고, 연결이 끊기자 ready 3, unacked 0이 되어 새 컨슈머가 `redelivered` true로 받았다. 메시지를 받은 채널이 아닌 다른 채널에서 `basic.ack`를 보내자 ack를 보낸 쪽 채널이 `406 PRECONDITION_FAILED - unknown delivery tag 1`로 닫혔고, 원래 채널이 쥔 메시지는 unacked 1로 그대로 남았다. 이미 ack한 delivery tag를 다시 ack해도 같은 406으로 그 채널이 닫혔다. 컨슈머 ack 타임아웃의 노드 기본값은 `rabbitmqctl eval`로 조회하니 1800000ms(30분)였다. 타임아웃 동작은 quorum 큐에 `x-consumer-timeout`=5000 인자를 줘서 확인했다. 메시지를 받고 ack하지 않은 채널이 약 5초 뒤에 `406 PRECONDITION_FAILED - delivery acknowledgement on channel 1 timed out` 오류로 닫혔다(기본 30분 대신 짧은 값으로 줄여서 본 것이다). 같은 값을 정책 `consumer-timeout`으로 걸면 quorum 큐는 약 5초 뒤 닫혔지만 classic 큐는 100초 안에 닫히지 않았고, classic 큐에 `x-consumer-timeout` 인자를 주면 선언이 406으로 거부됐다. 그래서 classic 큐의 짧은 타임아웃 경로는 재현하지 못했다. 메모리 증가는 측정하지 않았다.
