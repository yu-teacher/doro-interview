---
slug: "rmq-12"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 2
title: "@RabbitListener 메서드가 예외를 던지면 기본적으로 메시지는 어떻게 되고, 무한 재전달은 어떻게 막나요?"
keywords: ["기본은 거부 후 재큐잉", "defaultRequeueRejected false", "AmqpRejectAndDontRequeueException", "데드 레터 익스체인지로 라우팅"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/exception-handling.html", "https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html", "https://docs.spring.io/spring-amqp/reference/amqp/receiving-messages/async-annotation-driven/error-handling.html", "https://docs.spring.io/spring-amqp/reference/amqp/containerAttributes.html", "https://docs.spring.io/spring-amqp/reference/amqp/broker-configuration.html"]
concepts: [dlq-retry]
importance: 2
links: [{to: "rmq-13", kind: FOLLOWUP}, {to: "rmq-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
리스너가 예외를 던지면 컨테이너가 이를 `ListenerExecutionFailedException`으로 감싸고, 보통 메시지는 거부된 뒤 브로커가 다시 큐에 넣습니다. 그래서 계속 실패하는 메시지는 끝없이 재전달될 수 있습니다. 막는 방법은 컨테이너의 `defaultRequeueRejected`를 `false`로 두어 메시지를 버리거나, 데드 레터 익스체인지가 설정돼 있으면 그쪽으로 보내는 것입니다. 특정 예외에서만 재큐잉을 끊고 싶으면 `AmqpRejectAndDontRequeueException`을 던지면 설정과 상관없이 재큐잉하지 않고, 반대로 `ImmediateRequeueAmqpException`은 무조건 재큐잉합니다.

(공식 문서) Spring AMQP 예외 처리 문서는 리스너 예외가 `ListenerExecutionFailedException`으로 감싸이고 보통 메시지가 거부되어 브로커가 재큐잉하며, `defaultRequeueRejected=false`이면 폐기되거나 데드 레터 익스체인지로 라우팅된다고 한다. 복원력 문서는 `AmqpRejectAndDontRequeueException`이 설정과 무관하게 재큐잉을 막고 2.1부터의 `ImmediateRequeueAmqpException`이 정반대 동작을 한다고 설명한다. 컨테이너 속성 문서는 `defaultRequeueRejected`의 기본값이 true라고 한다.
(공식 문서) 데드 레터 큐 인자 예시(`x-dead-letter-exchange`, `x-dead-letter-routing-key`)는 브로커 구성 문서에 있다. 데드 레터 익스체인지의 브로커 쪽 동작 규칙은 RabbitMQ 문서를 읽지 못해 다루지 않는다.
(실험 확인) RabbitMQ 4.4.0에서 큐를 `x-dead-letter-exchange`와 `x-dead-letter-routing-key`로 선언하고 메시지를 `basic.reject`(requeue=false)하자 DLX에 묶인 큐로 넘어갔고, 헤더에 `x-death`(reason `rejected`, count 1, 원래 큐·익스체인지·라우팅 키)와 `x-first-death-*`, `x-last-death-*`가 붙었다. DLX 설정이 없는 큐에서는 requeue=false로 거부한 메시지가 그냥 사라졌다. requeue=true로 거부한 메시지는 데드 레터가 되지 않고 같은 큐로 돌아왔다. `x-dead-letter-routing-key`가 없으면 원래 라우팅 키가 유지됐다. 같은 경로로 메시지 TTL 만료(reason `expired`), 큐의 `x-message-ttl`, `x-max-length`(reason `maxlen`, 가장 오래된 메시지가 밀려남)도 데드 레터가 됐고, `nack`(multiple=true, requeue=false)은 3건을 한 번에 데드 레터로 보냈다. Spring의 `ListenerExecutionFailedException`, `defaultRequeueRejected`, `AmqpRejectAndDontRequeueException` 동작은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
