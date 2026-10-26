---
slug: "rmq-02"
topic: "messaging-rabbitmq"
tier: BASIC
difficulty: 1
title: "RabbitMQ(AMQP 0-9-1)에서 프로듀서, 익스체인지, 바인딩, 큐, 컨슈머는 각각 무엇이고 어떻게 연결되나요?"
keywords: ["프로듀서는 익스체인지로 발행", "익스체인지가 규칙대로 큐로 라우팅", "바인딩은 익스체인지와 큐의 관계", "컨슈머는 큐에서 수신"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-three-java", "https://www.rabbitmq.com/tutorials/tutorial-four-java", "https://docs.spring.io/spring-amqp/reference/amqp/abstractions.html"]
concepts: [messaging]
importance: 3
links: [{to: "rmq-04", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
프로듀서는 메시지를 큐가 아니라 익스체인지로 발행합니다. 익스체인지는 받은 메시지를 익스체인지 타입이 정한 규칙에 따라 큐 하나나 여러 개에 넣거나 버립니다. 익스체인지와 큐를 잇는 관계가 바인딩이고, 바인딩에는 라우팅 키와 비교할 바인딩 키를 붙일 수 있습니다. 큐는 메시지를 쌓아 두는 버퍼이고, 컨슈머는 익스체인지가 아니라 큐에서 메시지를 받아 처리합니다. 그래서 프로듀서는 익스체인지까지만 알면 되고, 어느 큐로 갈지는 익스체인지와 바인딩이 정합니다.

(공식 문서) 튜토리얼 3은 RabbitMQ 메시징 모델의 핵심 아이디어가 프로듀서가 메시지를 큐로 직접 보내지 않는다는 것이라고 설명한다. 프로듀서는 익스체인지로만 보내고, 익스체인지가 타입에 정해진 규칙으로 특정 큐에 붙이거나 여러 큐에 붙이거나 버린다. 익스체인지와 큐의 관계를 바인딩이라 부른다.
(공식 문서) 튜토리얼 4는 바인딩에 붙는 키를 발행 시의 라우팅 키와 구분해 바인딩 키라 부르고, 그 의미는 익스체인지 타입에 따라 다르다고 한다. Spring AMQP 추상화 문서도 프로듀서는 익스체인지로 보내고 컨슈머는 큐에서 받으며 바인딩이 둘을 잇는다고 설명한다.
(실험 확인) RabbitMQ 4.4.0 단일 노드에서 AMQP 0-9-1 소켓 클라이언트(직접 작성한 스크립트)로 확인했다. 프로듀서는 익스체인지로만 발행했고, direct 익스체인지에 큐 두 개를 같은 키 `error`로 묶으면 두 큐에 한 부씩 들어갔으며 다른 키 `info`로 묶은 큐에는 가지 않았다. 키를 `Error`처럼 대소문자만 바꿔 발행하면 어느 큐에도 가지 않았다. fanout은 발행 키(`whatever`)와 바인딩 키(`x`, 빈 문자열)에 상관없이 바인딩된 두 큐 모두에 전달했다. 컨슈머가 큐에서 받는 부분은 `basic.get`과 `basic.consume`으로 확인했다.
