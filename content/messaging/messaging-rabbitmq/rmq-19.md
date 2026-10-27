---
slug: "rmq-19"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 3
title: "변환에 실패하는 메시지(poison message)가 계속 재전달되는 것을 Spring AMQP는 어떻게 막나요?"
keywords: ["변환 실패는 리스너 호출 전에 발생", "ConditionalRejectingErrorHandler", "치명적 예외는 재큐잉 안 함", "MessageConversionException", "x-death 헤더가 있으면 폐기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/exception-handling.html", "https://docs.spring.io/spring-amqp/reference/amqp/containerAttributes.html"]
concepts: [dlq-retry]
importance: 1
links: [{to: "rmq-12", kind: PREREQ}]
---
**모범 답변 (30~60초)**
일부 변환 예외는 리스너 코드에 도달하기 전에 던져지기 때문에 `defaultRequeueRejected`가 기본값 true이면 같은 메시지가 끝없이 재전달될 수 있습니다. 그래서 기본 에러 핸들러는 `ConditionalRejectingErrorHandler`이고, `MessageConversionException`, 검증 실패, 타입 불일치, `ClassCastException` 같은 복구할 수 없는 예외는 재큐잉 없이 거부합니다. `FatalExceptionStrategy`로 치명적으로 볼 예외를 추가할 수도 있습니다. 2.1부터는 치명적 예외를 낸 메시지에 `x-death` 헤더가 있으면, 즉 데드 레터를 거쳐 되돌아온 순환이면 로그만 남기고 폐기하며, 2.1.9부터는 MANUAL 모드에서도 거부합니다.

(공식 문서) Spring AMQP 예외 처리 문서는 변환 불가 메시지처럼 일부 예외가 사용자 코드 이전에 던져져 기본 설정(`defaultRequeueRejected=true`)이면 계속 재전달된다고 설명한다. 1.3.2부터 기본 `ErrorHandler`가 `ConditionalRejectingErrorHandler`이며 `MessageConversionException`, `MethodArgumentNotValidException`, `MethodArgumentTypeMismatchException`, `NoSuchMethodException`, `ClassCastException` 등을 재큐잉 없이 거부한다고 한다. `FatalExceptionStrategy`로 규칙을 바꿀 수 있고, 2.1부터 치명적 예외 메시지에 `x-death` 헤더가 있으면 로그 후 폐기하며(`discardFatalsWithXDeath`), 2.1.9부터 MANUAL 모드에서도 재큐잉 없이 거부한다고 한다(`rejectManual`). 컨테이너 속성 문서는 `errorHandler`의 기본값이 `ConditionalRejectingErrorHandler`라고 한다.
(실험 확인) RabbitMQ 4.4.0에서 데드 레터 처리된 메시지에는 브로커가 `x-death` 헤더(reason, count, queue, exchange, routing-keys)를 붙였다(rmq-12). 다만 `ConditionalRejectingErrorHandler`와 `discardFatalsWithXDeath` 등 Spring 동작은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
