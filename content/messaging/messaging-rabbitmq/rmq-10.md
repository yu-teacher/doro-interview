---
slug: "rmq-10"
topic: "messaging-rabbitmq"
tier: BASIC
difficulty: 1
title: "Spring AMQP에서 RabbitTemplate, @RabbitListener, RabbitAdmin은 각각 무슨 일을 하나요?"
keywords: ["RabbitTemplate으로 발행", "@RabbitListener 비동기 수신", "리스너 컨테이너가 소비 담당", "RabbitAdmin 선언", "빈으로 큐·익스체인지·바인딩 정의"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/abstractions.html", "https://docs.spring.io/spring-amqp/reference/amqp/template.html", "https://docs.spring.io/spring-amqp/reference/amqp/message-converters.html", "https://docs.spring.io/spring-amqp/reference/amqp/receiving-messages/async-annotation-driven/enable.html", "https://docs.spring.io/spring-amqp/reference/amqp/receiving-messages/async-consumer.html", "https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html"]
concepts: [messaging]
importance: 2
links: [{to: "rmq-11", kind: FOLLOWUP}, {to: "rmq-14", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`RabbitTemplate`은 메시지를 보내고 받는 중심 도구이고, `convertAndSend`로 객체를 컨버터로 변환해 익스체인지와 라우팅 키로 발행합니다. `@RabbitListener`는 큐를 지정한 메서드를 비동기 소비자로 만드는 가장 편한 방법이고, 설정 클래스에 `@EnableRabbit`을 두면 활성화되며 실제 수신은 리스너 컨테이너가 맡습니다. `RabbitAdmin`은 `Queue`, `Exchange`, `Binding`을 빈으로 정의해 두면 브로커에 선언해 주는 역할인데, 연결이 처음 열릴 때 수행하고 연결이 끊겼다 복구돼도 다시 선언합니다.

(공식 문서) AmqpTemplate 문서는 템플릿이 메시지 송수신의 중심이며 현재 구현이 `RabbitTemplate` 하나라고 설명한다. 메시지 컨버터 문서는 `convertAndSend`가 `MessageConverter`에 위임해 객체를 메시지로 바꾼다고 한다. 비동기 소비자 문서는 `@RabbitListener`가 비동기 소비자를 설정하는 가장 편한 방법이라고 하고, 리스너 엔드포인트 활성화 문서는 `@EnableRabbit`을 설정에 추가하라고 한다. 컨테이너 문서는 컨테이너가 능동적 역할을 맡아 리스너 콜백이 수동적으로 남게 한다고 설명한다.
(공식 문서) 복원력 문서는 `RabbitAdmin`이 시작 시 익스체인지·큐·바인딩을 선언하며 `ConnectionListener`를 통해 지연 수행하므로 연결이 끊겼다 다시 맺어지면 다시 적용된다고 한다. 추상화 문서는 `@Configuration` 안의 `@Bean`으로 큐·익스체인지·바인딩을 정의하면 애플리케이션 시작 시 브로커에 선언된다고 설명한다.
(실험 미실시) Spring AMQP 쪽 동작은 Spring 라이브러리를 쓸 수 없는 환경이라 직접 실행해 확인하지는 않았고 문서 근거만 적었다.
