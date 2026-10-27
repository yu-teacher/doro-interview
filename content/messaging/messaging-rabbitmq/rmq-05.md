---
slug: "rmq-05"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 2
title: "topic 익스체인지에서 `*`와 `#` 바인딩 키는 어떻게 매칭되고, 여러 바인딩에 걸리거나 하나도 안 걸리면 어떻게 되나요?"
keywords: ["별표는 정확히 한 단어", "샵은 0개 이상 단어", "한 큐에 한 번만 전달", "매칭 없으면 버려짐", "샵만 쓰면 fanout처럼"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-five-java", "https://docs.spring.io/spring-amqp/reference/amqp/abstractions.html"]
concepts: [messaging]
importance: 2
links: [{to: "rmq-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
라우팅 키는 점으로 구분한 단어 목록이고, 바인딩 키의 `*`는 정확히 한 단어, `#`는 0개 이상의 단어를 대신합니다. 예를 들어 `*.orange.*`는 세 단어 중 가운데가 orange인 키에 맞고, `lazy.#`는 lazy로 시작하는 모든 키에 맞습니다. 한 메시지가 같은 큐의 여러 바인딩에 걸려도 그 큐에는 한 번만 전달됩니다. 어느 바인딩에도 안 맞으면 메시지는 버려집니다. 바인딩 키를 `#` 하나만 쓰면 모든 메시지를 받아 fanout처럼 동작하고, 와일드카드가 없으면 direct처럼 동작합니다.

(공식 문서) 튜토리얼 5는 topic 익스체인지의 라우팅 키가 점으로 구분한 단어 목록이어야 하고 255바이트까지라고 설명한다. `*`는 정확히 한 단어, `#`는 0개 이상의 단어를 대신한다. 예시에서 `lazy.pink.rabbit`은 두 바인딩에 맞아도 큐에는 한 번만 전달되고, 어느 바인딩에도 안 맞는 `quick.brown.fox`와 단어 수가 안 맞는 `orange`는 버려진다고 한다. `#` 하나로 묶으면 fanout처럼, 특수 문자가 없으면 direct처럼 동작한다고도 한다.
(공식 문서) Spring AMQP 추상화 문서도 topic 바인딩이 `*`(정확히 하나)와 `#`(0개 이상) 패턴을 지원한다고 한다.
(실험 확인) RabbitMQ 4.4.0 topic 익스체인지에 튜토리얼과 같은 바인딩(큐 Q1은 `*.orange.*`, 큐 Q2는 `*.*.rabbit`과 `lazy.#`)을 걸고 발행했다. `quick.orange.rabbit`과 `lazy.orange.elephant`는 두 큐에, `quick.orange.fox`는 Q1에만, `lazy.brown.fox`는 Q2에만 갔다. `lazy.pink.rabbit`은 Q2의 두 바인딩에 모두 맞았지만 한 번만 전달됐다. `quick.brown.fox`, `orange`, `quick.orange.male.rabbit`은 어느 큐에도 가지 않고 버려졌고(`*`는 정확히 한 단어), `lazy.orange.male.rabbit`과 단어 하나짜리 `lazy`는 `lazy.#`에 맞았다(`#`는 0개 이상). 바인딩 키가 `#` 하나인 큐는 `a.b`, `a.b.c`, 빈 문자열, `x`를 모두 받았고, 와일드카드 없는 바인딩 `a.b`는 키 `a.b`만 받아 direct처럼 동작했다. 255바이트 라우팅 키는 발행·전달됐다(256바이트 이상은 AMQP 짧은 문자열 한도라 보내 보지 못했다). Spring 쪽 설명은 문서 근거다.
