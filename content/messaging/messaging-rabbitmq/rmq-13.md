---
slug: "rmq-13"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 3
title: "Spring AMQP에서 소비 재시도를 구성하면 재시도가 모두 실패했을 때 메시지는 어떻게 처리할 수 있나요?"
keywords: ["StatefulRetryOperationsInterceptor", "MessageRecoverer", "RepublishMessageRecoverer", "재발행 후 원본은 ack", "messageId로 메시지 식별"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html"]
concepts: [dlq-retry, resilience]
importance: 2
links: [{to: "rmq-20", kind: FOLLOWUP}, {to: "kfk-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
advice chain에 `StatefulRetryOperationsInterceptor` 같은 Spring Retry 인터셉터를 넣어 재시도 횟수와 백오프를 정합니다. 진행 중인 트랜잭션이 롤백될 수 있으면 stateful 재시도가 적합한데, 메시지를 식별할 고유 값이 필요해서 발신 측이 `messageId`를 넣는 것이 가장 단순합니다. 재시도가 소진되면 `MessageRecoverer`가 호출됩니다. 기본 recoverer는 메시지를 소비하고 경고만 남기며, `RejectAndDontRequeueRecoverer`는 재큐잉 없이 거부해 브로커의 데드 레터 설정으로 넘기며, `RepublishMessageRecoverer`는 예외 정보를 헤더에 담아 지정한 익스체인지로 다시 발행합니다. recoverer가 최종 예외를 소비하면 원본은 ack되어 브로커가 데드 레터로 보내지 않습니다.

(공식 문서) 복원력 문서는 stateful 재시도가 진행 중인 트랜잭션이 롤백될 때 적합하고 메시지를 고유하게 식별하는 수단이 필요하며, 가장 단순한 방법이 발신 측이 `MessageId`를 넣는 것이라고 설명한다. 재시도 소진 시 `MessageRecoverer`가 호출되고, 기본 recoverer는 메시지를 소비하며 WARN을 남기고, `RejectAndDontRequeueRecoverer`는 재큐잉 없이 거부하며, 1.3부터의 `RepublishMessageRecoverer`는 예외 메시지·원래 익스체인지·라우팅 키 같은 정보를 헤더에 담아 다시 발행한다고 한다. recoverer가 최종 예외를 소비하면 메시지는 ack되고 브로커가 데드 레터 익스체인지로 보내지 않는다고 명시한다.
(공식 문서) 같은 문서는 컨슈머가 만든 배치에는 재시도를 설정하지 말라고 권고한다. 어느 메시지가 실패했는지 프레임워크가 알 수 없기 때문이다.
(실험 미실시) Spring AMQP 쪽 동작은 Spring 라이브러리를 쓸 수 없는 환경이라 직접 실행해 확인하지는 않았고 문서 근거만 적었다.
