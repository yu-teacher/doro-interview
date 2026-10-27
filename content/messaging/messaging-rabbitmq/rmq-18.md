---
slug: "rmq-18"
topic: "messaging-rabbitmq"
tier: TRICKY
difficulty: 3
title: "바인딩된 큐가 없거나 라우팅 키가 맞지 않으면 메시지는 어떻게 되고, Spring AMQP에서는 어떻게 감지하나요?"
keywords: ["매칭 없으면 버려짐", "mandatory와 publisher returns", "없는 익스체인지는 채널 종료", "ConfirmCallback의 cause", "CachingConnectionFactory 설정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-three-java", "https://www.rabbitmq.com/tutorials/tutorial-four-java", "https://docs.spring.io/spring-amqp/reference/amqp/template.html", "https://docs.spring.io/spring-amqp/reference/amqp/connections.html"]
concepts: [messaging, delivery-guarantee]
importance: 2
links: [{to: "rmq-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
큐에 도달하지 못한 메시지는 조용히 버려질 수 있습니다. 튜토리얼 기준으로 어느 바인딩에도 안 맞는 메시지는 폐기되고, 큐가 하나도 바인딩되지 않은 익스체인지로 보낸 메시지도 사라집니다. Spring AMQP에서 이를 감지하려면 `CachingConnectionFactory`의 `publisherReturns`를 켜고 `RabbitTemplate`의 `mandatory`를 true로 둔 뒤 `ReturnsCallback`을 등록해 `NO_ROUTE` 같은 반환 사유를 받습니다. 존재하지 않는 익스체인지로 보내면 반환이 아니라 메시지가 버려지고 채널이 예외와 함께 닫히는데, 이때는 `ConfirmType.CORRELATED`의 `ConfirmCallback`이 nack과 원인(`cause`)을 받을 수 있습니다.

(공식 문서) 튜토리얼 3은 존재하지 않는 익스체인지로의 발행은 금지돼 있고, 큐가 바인딩되지 않은 익스체인지로 보낸 메시지는 유실된다고 설명한다. 튜토리얼 4와 5는 어떤 바인딩에도 안 맞는 메시지는 폐기된다고 한다.
(공식 문서) Spring AMQP 템플릿 문서는 대상 큐가 없는 경우는 publisher returns가 다루고(템플릿 `mandatory`가 true이고 `publisherReturns`가 켜진 `CachingConnectionFactory`가 필요, `ReturnsCallback`의 `replyText` 예시 NO_ROUTE), 존재하지 않는 익스체인지로 보내면 메시지가 버려지고 return은 생기지 않으며 채널이 예외로 닫힌다고 설명한다. `ConfirmCallback`은 `CorrelationData`, ack 여부, nack 시 가능한 `cause`를 받고, 템플릿당 콜백은 하나만 지원한다고 한다. 연결 문서는 `publisherConfirmType`을 `CORRELATED`로, `publisherReturns`를 true로 설정하라고 한다.
(실험 확인) RabbitMQ 4.4.0에서 큐가 바인딩되지 않은 fanout 익스체인지로 발행한 메시지는 mandatory 없이는 조용히 사라졌고, mandatory=true이면 `basic.return`(312 NO_ROUTE)이 돌아왔다. topic 익스체인지에서 어떤 바인딩에도 안 맞는 키도 mandatory에서 NO_ROUTE로 반환됐다. 발행 확인을 켠 채널에서는 반환된 메시지에도 `basic.ack`가 왔다. 존재하지 않는 익스체인지로 발행하면 반환이 아니라 채널이 `404 NOT_FOUND - no exchange` 오류로 닫혔고 같은 연결의 다른 채널은 계속 동작했다. Spring의 `publisherReturns`·`ConfirmCallback`의 `cause`는 실행하지 못했다(Spring 라이브러리를 쓸 수 없는 환경, 문서 근거).
