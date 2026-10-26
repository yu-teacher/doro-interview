---
slug: "rmq-20"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 3
title: "퀴럼 큐의 delivery limit으로 재전달을 끊을 때 Spring AMQP에서 무엇을 조심해야 하나요?"
keywords: ["x-delivery-limit", "개별 reject만 카운트", "multiple nack은 미카운트", "4.0.6부터 컨테이너가 개별 거부", "이미 settle한 전달을 또 settle하면 채널 종료"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html"]
concepts: [dlq-retry, delivery-guarantee]
importance: 1
links: [{to: "rmq-13", kind: PREREQ}]
---
**모범 답변 (30~60초)**
클라이언트에서 재전달 횟수를 세는 대신, 퀴럼 큐를 `x-delivery-limit` 인자로 선언해(`QueueBuilder.deliveryLimit()`) 브로커가 한도를 넘은 메시지를 데드 레터로 보내게 할 수 있다고 Spring AMQP 문서가 설명합니다. 주의할 점은 문서가 브로커가 개별로 settle된 전달만 센다고 한다는 것입니다. 실제로 RabbitMQ 4.4.0에서 `basic.reject`(requeue)는 셌지만 단일 `basic.nack`과 `multiple` 누적 nack은 세지 않았습니다. 그래서 4.0.6부터 컨테이너는 실패한 전달을 개별로 거부합니다. 다만 리스너가 `Channel`로 직접 settle할 수 있는 경우(MANUAL 등)에는 누적 nack이 남으니 직접 개별 reject해야 하고, 이미 settle한 전달을 또 settle하면 채널이 닫힙니다.

(공식 문서) Spring AMQP 복원력 문서의 Broker Delivery Limits 절은 퀴럼 큐를 `x-delivery-limit`로 선언하면 `x-delivery-count`가 한도를 넘을 때 브로커가 데드 레터 처리한다고 설명한다. 브로커는 `basic.reject` 또는 단일 delivery tag의 `basic.nack`처럼 개별로 settle된 전달만 세며 `multiple` 누적 nack은 세지 않고, 4.0.6부터 컨테이너가 실패한 전달을 개별 거부한다고 한다. `Channel`을 받는 리스너, `MANUAL` 등 컨테이너 외에 settle할 수 있는 경우와 여러 전달이 함께 걸린 경우에는 누적 nack을 유지하며, `NONE`에서는 전달이 거부되지도 세지지도 않는다고 한다.
(공식 문서) 퀴럼 큐 자체의 동작과 delivery limit의 브로커 쪽 규칙은 RabbitMQ 문서(docs/quorum-queues)가 봇 차단 응답을 돌려줘 읽지 못했다. 위 문서 근거는 Spring AMQP 문서가 설명하는 범위이고, 브로커 동작은 아래 실험으로 확인했다.
(실험 확인) RabbitMQ 4.4.0에서 퀴럼 큐를 `x-delivery-limit`=3과 데드 레터 설정으로 선언하고 한 메시지를 `basic.reject`(requeue=true)로 계속 거부하자 총 4번 전달된 뒤(첫 전달과 재전달 3번) 데드 레터로 갔고 `x-death`의 reason은 `delivery_limit`이었다. 재전달 메시지에는 `x-delivery-count` 헤더가 1, 2, 3으로 붙었다. `x-delivery-limit`을 주지 않은 퀴럼 큐는 21번 전달된 뒤 데드 레터가 됐다(기본 한도 20). 문서와 다른 점은, 단일 delivery tag의 `basic.nack`(multiple=false, requeue=true)은 이 환경에서 세지지 않았다는 것이다. 한도 2에서 6~7번 전달돼도 `x-delivery-count` 헤더가 붙지 않았고 데드 레터도 되지 않았다(`basic.get`과 컨슈머 모두 같았고, 대신 `x-acquired-count`만 늘었다). `multiple=true` 누적 nack도 6라운드 동안 세지지 않았다. 이 클라이언트가 `basic.nack`을 요청대로 보낸다는 것은 requeue=false로 보냈을 때 데드 레터가 된 것으로 확인했다. 4.0.6부터 컨테이너가 개별 거부한다는 부분과 Spring `QueueBuilder.deliveryLimit()`은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
