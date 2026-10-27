---
slug: "rmq-03"
topic: "messaging-rabbitmq"
tier: BASIC
difficulty: 1
title: "큐 이름만 지정해서 메시지를 보내는 것처럼 보이는 코드는 실제로 어떻게 동작하나요?"
keywords: ["이름 없는 기본 익스체인지", "빈 문자열 익스체인지", "라우팅 키가 큐 이름", "모든 큐가 자동 바인딩"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-three-java", "https://docs.spring.io/spring-amqp/reference/amqp/sending-messages.html", "https://docs.spring.io/spring-amqp/reference/amqp/abstractions.html"]
concepts: [messaging]
importance: 2
links: [{to: "rmq-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
큐에 직접 보내는 것처럼 보여도 실제로는 이름이 빈 문자열인 기본 익스체인지로 발행하는 것입니다. 기본 익스체인지는 라우팅 키와 같은 이름의 큐가 있으면 그 큐로 메시지를 보냅니다. AMQP 명세는 이름 없는 기본 direct 익스체인지를 제공하도록 하고, 선언된 모든 큐는 자기 이름을 라우팅 키로 그 익스체인지에 자동으로 묶입니다. 그래서 `basicPublish("", "hello", ...)`처럼 익스체인지는 비우고 라우팅 키에 큐 이름을 넣으면 단순한 일대일 전송이 됩니다. `RabbitTemplate`도 익스체인지와 라우팅 키 기본값이 빈 문자열이라 같은 방식으로 큐에 보낼 수 있습니다.

(공식 문서) 튜토리얼 3은 빈 문자열이 기본(이름 없는) 익스체인지를 뜻하며, 메시지가 routingKey로 지정한 이름의 큐가 있으면 그 큐로 라우팅된다고 설명한다.
(공식 문서) Spring AMQP 추상화 문서는 AMQP 명세가 이름 없는 기본 direct 익스체인지를 요구하며 선언된 모든 큐가 큐 이름을 라우팅 키로 그 익스체인지에 바인딩된다고 한다. 메시지 전송 문서는 템플릿의 익스체인지·라우팅 키 기본값이 빈 문자열이고 큐 이름을 라우팅 키로 주면 기본 익스체인지를 통한 단순 점대점 전송이 된다고 설명한다.
(실험 확인) RabbitMQ 4.4.0에서 큐 `hello`를 선언한 뒤 익스체인지를 빈 문자열, 라우팅 키를 `hello`로 발행하니 별도 바인딩 선언 없이 그 큐에 도착했다. 관리 API의 익스체인지 목록에는 이름이 빈 문자열인 durable direct 익스체인지가 기본으로 있었다. 반례로 존재하지 않는 큐 이름을 라우팅 키로 발행하면 오류 없이 버려졌고, mandatory 플래그를 주면 `basic.return`으로 `312 NO_ROUTE`가 돌아왔다. Spring `RabbitTemplate`의 기본값은 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
