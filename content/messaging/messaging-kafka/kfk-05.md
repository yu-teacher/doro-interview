---
slug: "kfk-05"
topic: "messaging-kafka"
tier: BASIC
difficulty: 1
title: "프로듀서의 `acks` 설정 0, 1, all은 각각 무엇을 의미하고 기본값은 무엇인가요?"
keywords: ["acks=0은 응답을 기다리지 않음", "acks=1은 리더만 기록", "acks=all은 동기화된 복제본 전체", "기본값 all", "지연과 내구성의 교환"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/configuration/producer-configs/", "https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/producer/KafkaProducer.html"]
concepts: [delivery-guarantee]
importance: 3
links: [{to: "kfk-11", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`acks`는 프로듀서가 요청을 완료로 보기 전에 리더에게 요구하는 확인 수준입니다. `acks=0`은 서버의 응답을 기다리지 않아 전달 보장이 없고 재시도도 의미가 없습니다. `acks=1`은 리더가 자기 로그에 기록하면 바로 응답해서, 팔로워가 복제하기 전에 리더가 죽으면 그 레코드를 잃을 수 있습니다. `acks=all`은 리더가 그 시점의 동기화된 복제본(ISR) 전체의 확인을 기다려서, 동기화된 복제본이 하나라도 살아 있는 한 레코드가 유실되지 않는 가장 강한 보장입니다. Kafka 4.3 문서 기준 기본값은 `all`이고, 가장 느린 대신 가장 내구성이 높은 설정입니다.

(공식 문서) 프로듀서 설정 문서(4.3)의 `acks` 항목은 `acks=0`이면 서버 응답을 기다리지 않고 보장이 없으며 재시도 설정이 효력이 없고 오프셋은 항상 -1로 돌아온다고 한다. `acks=1`은 리더가 로컬 로그에 쓰고 팔로워의 완전한 확인을 기다리지 않고 응답하므로 직후 리더가 죽으면 레코드가 유실된다고 한다. `acks=all`은 ISR 전체의 확인을 기다리며 ISR 복제본이 하나라도 살아 있는 한 유실되지 않는 가장 강한 보장이고, 기본값은 `all`이라고 한다.
(공식 문서) KafkaProducer Javadoc은 기본값 `all`이 전체 커밋을 기다리는 가장 느리지만 가장 내구성 있는 설정이라고 설명한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 같은 레코드를 `acks=0`으로 보내자 `RecordMetadata`의 오프셋이 -1로 돌아왔고, `acks=1`과 `acks=all`은 실제 오프셋을 돌려받았다. 프로듀서 설정 클래스의 기본값은 `acks=all`이었고, `acks`가 0이나 1이면 클라이언트가 멱등성을 끈다는 로그가 찍혔다. 리더가 팔로워 복제 전에 죽어 유실되는 시나리오는 브로커 장애와 다중 브로커가 필요해 재현하지 못했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
