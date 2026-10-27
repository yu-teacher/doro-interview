---
slug: "rmq-14"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 2
title: "Spring AMQP의 메시지 컨버터는 기본으로 무엇을 쓰고, 왜 Java 직렬화 대신 JSON 컨버터를 쓰라고 하나요?"
keywords: ["기본 SimpleMessageConverter", "문자열·바이트 배열·직렬화 객체", "Java 직렬화는 결합도 높음", "JSON 컨버터는 언어 중립", "content-type으로 변환 결정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-amqp/reference/amqp/message-converters.html", "https://docs.spring.io/spring-amqp/reference/amqp/abstractions.html"]
concepts: [messaging]
importance: 1
---
**모범 답변 (30~60초)**
`RabbitTemplate`의 기본 컨버터는 `SimpleMessageConverter`로, 문자열과 바이트 배열과 `Serializable` 객체를 다룹니다. 일반 객체를 보내면 Java 직렬화에 의존하게 되는데, 문서는 이를 권장하지 않습니다. 프로듀서와 컨슈머가 같은 클래스에 강하게 묶이고 Java가 아닌 시스템과는 주고받을 수 없기 때문입니다. 대안으로 JSON 컨버터를 템플릿과 리스너에 설정하면 언어와 플랫폼에 덜 묶인 메시지를 보낼 수 있습니다. 수신할 때 컨버터는 메시지의 content-type 속성을 보고 변환 방식을 정하므로 보내는 쪽이 이 속성을 맞게 붙여야 합니다.

(공식 문서) 메시지 컨버터 문서는 `SimpleMessageConverter`가 템플릿의 기본 구현이며 텍스트, 직렬화된 Java 객체, 바이트 배열을 처리한다고 한다. content-type이 `text`로 시작하면 content-encoding으로 문자셋을 정하고(없으면 UTF-8), `application/x-java-serialized-object`이면 역직렬화를 시도하며, 그 밖은 바이트 배열로 돌려준다. Java 직렬화는 프로듀서와 컨슈머를 강하게 결합시키고 비Java 시스템 사용을 막으므로 권장하지 않으며 JSON이 더 유연하고 이식성 있는 대안이라고 설명한다.
(공식 문서) 같은 문서는 JSON 변환용으로 Jackson 3 기반 `JacksonJsonMessageConverter`를 소개하고, 기존 Jackson 2 기반 클래스는 4.0에서 제거 예정으로 deprecated 됐다고 한다(문서 기준 Spring AMQP 4.1.x).
(실험 미실시) Spring AMQP 쪽 동작은 Spring 라이브러리를 쓸 수 없는 환경이라 직접 실행해 확인하지는 않았고 문서 근거만 적었다.
