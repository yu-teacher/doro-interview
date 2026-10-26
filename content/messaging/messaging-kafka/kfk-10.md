---
slug: "kfk-10"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "멱등 프로듀서(idempotent producer)는 무엇을 보장하고, 어떻게 중복을 막으며, 한계는 무엇인가요?"
keywords: ["프로듀서 ID와 시퀀스 번호", "재시도 중복 방지", "Kafka 3.0부터 기본 활성화", "acks=all과 retries 조건", "단일 세션 범위"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/configuration/producer-configs/", "https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html"]
concepts: [idempotency, delivery-guarantee]
importance: 2
links: [{to: "kfk-15", kind: FOLLOWUP}, {to: "dst-07", kind: RELATED}, {to: "dst-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
응답을 못 받은 프로듀서가 다시 보내면 이미 기록된 메시지가 중복될 수 있는데, 멱등 프로듀서는 브로커가 프로듀서마다 ID를 주고 메시지에 붙는 시퀀스 번호로 중복을 걸러 재시도가 로그에 중복 기록되지 않게 합니다. Kafka 3.0부터 `enable.idempotence`는 기본 true이고, `acks=all`, `retries` 0 초과, `max.in.flight.requests.per.connection` 5 이하가 필요합니다. 명시적으로 켠 채 이 조건을 어기면 `ConfigException`이 나고, 켜지 않았다면 `acks`나 `retries`가 어긋날 때 조용히 꺼집니다(4.3.1에서 in-flight가 5를 넘으면 예외). 한계로, 보장은 한 프로듀서 세션 안에서만 유효하고 애플리케이션이 직접 다시 보내는 중복은 걸러내지 못합니다.

(공식 문서) Design 문서는 0.11.0.0부터 프로듀서가 멱등 전송 옵션을 지원하며, 브로커가 프로듀서에 ID를 주고 프로듀서가 메시지와 함께 보내는 시퀀스 번호로 중복을 제거한다고 설명한다. 프로듀서 설정 문서는 `enable.idempotence`가 기본 true이며 `max.in.flight.requests.per.connection`이 5 이하, `retries`가 0 초과, `acks`가 `all`이어야 하고, 충돌하는 설정이 있고 멱등성을 명시적으로 켜지 않았다면 꺼지며, 명시적으로 켰는데 충돌하면 `ConfigException`이 난다고 한다. 값이 5를 넘으면 브로커가 프로듀서당 최대 5개 배치만 기억하기 때문이라고 설명한다.
(공식 문서) KafkaProducer Javadoc은 3.0부터 `enable.idempotence` 기본값이 true이며, 애플리케이션 수준의 재전송은 중복 제거가 되지 않으므로 피해야 하고, 멱등성은 단일 세션 안에서 보낸 메시지에만 보장된다고 한다.
(실험 확인) kafka-clients 4.3.1(Corretto 21)을 Kafka 4.3.1 단일 브로커(KRaft, 컨테이너)에 붙여 실행: 프로듀서 설정 클래스의 기본값은 `enable.idempotence=true`, `acks=all`, `retries=2147483647`, `max.in.flight.requests.per.connection=5`였고 기본 설정으로 만들면 `Instantiated an idempotent producer.` 로그가 찍혔다.
(실험 확인) 멱등성을 명시하지 않고 `acks`를 0 또는 1로 두면 `Idempotence will be disabled because acks is set to ..., not set to 'all'.` 로그와 함께 멱등성이 꺼진 채 전송에 성공했고, `retries=0`만 두어도 멱등성이 꺼진 채 전송에 성공했다. 멱등성을 명시적으로 켜고 `acks=1`이면 `ConfigException`(Must set acks to all ...), `retries=0`이면 `ConfigException`(Must set retries to non-zero ...), `max.in.flight.requests.per.connection=6`이면 `ConfigException`(must be set to at most 5. Current value is 6)이 났다.
(실험 확인) 문서와 달랐던 점: 멱등성을 명시하지 않고 `max.in.flight.requests.per.connection=6`만 두었을 때도 이 환경에서는 조용히 꺼지지 않고 같은 `ConfigException`이 났다. 그래서 본문의 "충돌해도 조용히 꺼진다"를 `acks`·`retries` 충돌로 좁혔다. 재검증에서 `acks=0`과 in-flight 6을 함께 두면 멱등성을 끈다는 로그가 찍힌 뒤에도 같은 예외가 났고, `enable.idempotence=false`를 명시해야 in-flight 6으로 전송됐다. 서로 다른 프로듀서 세션에서 같은 키·값을 보내면 별개 레코드로 쌓였다(애플리케이션 재전송은 중복 제거 대상이 아님). 네트워크 장애로 재시도가 일어났을 때 브로커가 시퀀스 번호로 중복을 걸러 내는 동작은 장애를 주입할 수 없어 재현하지 못했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
