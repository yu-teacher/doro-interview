---
slug: "rmq-04"
topic: "messaging-rabbitmq"
tier: BASIC
difficulty: 1
title: "익스체인지 타입 direct, fanout, topic, headers는 각각 어떻게 라우팅하나요?"
keywords: ["direct는 키 정확히 일치", "fanout은 모든 바인딩 큐에 전달", "topic은 패턴 매칭", "headers 타입"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-three-java", "https://www.rabbitmq.com/tutorials/tutorial-four-java", "https://www.rabbitmq.com/tutorials/tutorial-five-java", "https://docs.spring.io/spring-amqp/reference/amqp/abstractions.html"]
concepts: [messaging]
importance: 3
links: [{to: "rmq-05", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
direct는 메시지의 라우팅 키가 바인딩 키와 정확히 같은 큐로 보냅니다. fanout은 라우팅 키를 무시하고 바인딩된 모든 큐에 메시지를 보내는 브로드캐스트입니다. topic은 점으로 구분한 단어 목록을 패턴으로 매칭하는데, 별표는 단어 하나, 샵은 0개 이상의 단어를 대신합니다. 네 번째로 headers 타입도 있습니다. 심각도별로 나눠 받는 로그는 direct, 모든 구독자에게 알리는 이벤트는 fanout, 여러 분류를 조합해 구독하는 경우는 topic이 어울립니다. 같은 키로 여러 큐를 묶으면 direct도 fanout처럼 여러 큐에 전달합니다.

(공식 문서) 튜토리얼 3은 익스체인지 타입이 direct, topic, headers, fanout이고 fanout은 알고 있는 모든 큐에 메시지를 브로드캐스트하며 라우팅 키 값은 무시된다고 한다. 튜토리얼 4는 direct가 바인딩 키가 라우팅 키와 정확히 일치하는 큐로 보내고, 같은 키로 여러 큐를 묶으면 fanout처럼 동작한다고 설명한다. 튜토리얼 5와 Spring AMQP 추상화 문서는 topic의 와일드카드 규칙을 설명한다.
(보충) 용도별 추천 예시는 일반적인 설명이다.
(실험 확인) RabbitMQ 4.4.0에서 direct·fanout·topic·headers 익스체인지를 모두 선언해 발행했다. direct는 키가 정확히 같을 때만 전달했고(대소문자도 구분) 같은 키로 큐 두 개를 묶으면 두 큐에 다 들어갔다. fanout은 발행 키와 바인딩 키를 무시했다. headers는 라우팅 키를 무시하고 바인딩의 `x-match` 인자와 메시지 헤더로 판단했다. `x-match=all` 큐(바인딩 헤더 a=1, b=2)에는 헤더가 둘 다 맞는 메시지만 들어갔고, `x-match=any` 큐에는 하나만 맞는 메시지(a=1)도 들어갔으며, 하나도 안 맞는 헤더(c=1)나 값이 다른 헤더(b=3)는 두 큐 어디에도 가지 않았다. topic 와일드카드는 rmq-05에 적었다. 답변이 headers의 동작을 풀어 설명하지 않는 것은 분량 때문이며, 위 동작은 실험으로 확인한 내용이다.
