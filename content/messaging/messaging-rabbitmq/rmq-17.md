---
slug: "rmq-17"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 2
title: "프리페치(prefetch) 값은 크게 잡는 게 좋나요, 작게 잡는 게 좋나요? Spring AMQP 기본값은 얼마인가요?"
keywords: ["컨슈머당 미확인 메시지 상한", "Spring AMQP 기본 250", "크고 느린 메시지는 낮게", "엄격한 순서는 1", "저트래픽 다중 소비자는 낮춰 고르게 분배"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/receiving-messages/async-consumer.html", "https://docs.spring.io/spring-amqp/reference/amqp/containerAttributes.html", "https://www.rabbitmq.com/tutorials/tutorial-two-java"]
concepts: [partition-consumer-group]
importance: 2
links: [{to: "rmq-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
프리페치는 컨슈머 하나에 ack 전까지 한꺼번에 내려보낼 수 있는 미확인 메시지 수의 상한입니다. 값이 크면 컨슈머가 놀지 않아 처리량이 좋아지지만 순서대로 처리되지 않을 위험이 커집니다. Spring AMQP는 2.0부터 기본값을 250으로 두는데, 예전 기본값 1은 빠른 컨슈머를 충분히 쓰지 못하게 했기 때문입니다. 메시지가 크고 처리가 느리면 클라이언트 메모리에 쌓이니 낮추고, 엄격한 순서가 필요하면 1로 되돌려야 합니다. 트래픽이 적고 소비자가 여럿이면 값을 줄여야 메시지가 더 고르게 퍼집니다. `AcknowledgeMode.NONE`에서는 프리페치가 무시됩니다.

(공식 문서) Spring AMQP 비동기 소비자 문서는 프리페치 기본값이 예전에는 1이어서 효율적인 컨슈머가 충분히 활용되지 못했고 2.0부터 250이라고 설명한다. 프리페치를 낮춰야 하는 경우로 처리가 느린 큰 메시지(클라이언트 메모리에 쌓임), 엄격한 순서(1로 되돌림), 저용량에서 여러 컨슈머가 있어 더 고르게 나누고 싶은 경우를 든다. 컨테이너 속성 문서는 값이 높을수록 전달이 빠르지만 비순차 처리 위험이 커지고 `NONE` 모드에서는 무시된다고 한다.
(공식 문서) 튜토리얼 2는 `basicQos`로 prefetchCount=1을 주면 처리·ack 전에는 새 메시지를 주지 않는다고 한다.
(실험 확인) RabbitMQ 4.4.0에서 컨슈머 하나에 `basic.qos` 프리페치 3을 주고 10건이 쌓인 큐를 소비하자 3건(g1~g3)만 받고 7건이 큐에 남았으며, 1건을 ack하자 g4를 더 받았다. 같은 프리페치 3이라도 자동 ack(no-ack)로 소비하면 10건을 모두 받았다(프리페치 무시). 프리페치 3에서 s1을 requeue로 거부하자 s2, s3를 쥔 채 s1이 `redelivered` true로 다시 와서 컨슈머에게는 s1이 s2·s3 뒤에 도착했다(순서 뒤바뀜). 프리페치 1과 컨슈머 두 개의 분배는 rmq-09에 적었다. Spring AMQP의 기본값 250은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
