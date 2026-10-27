---
slug: "kfk-15"
topic: "messaging-kafka"
tier: DEEP
difficulty: 3
title: "Kafka 트랜잭션은 어떻게 설정하고, 컨슈머가 `read_committed`로 읽으면 무엇이 달라지나요?"
keywords: ["transactional.id 설정", "읽기-처리-쓰기를 원자적으로", "오프셋을 같은 트랜잭션에 커밋", "read_committed는 abort된 레코드를 숨김", "LSO까지만 읽음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/configuration/consumer-configs/", "https://kafka.apache.org/43/configuration/producer-configs/"]
concepts: [delivery-guarantee, distributed-consistency]
importance: 2
links: [{to: "dst-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
트랜잭션 프로듀서는 `transactional.id`를 설정해 여러 토픽 파티션에 원자적으로 쓰고, 컨슈머를 대신해 소비 오프셋도 같은 트랜잭션에 넣어서 읽고 처리하고 쓰는 흐름을 한 단위로 만듭니다. 결과는 트랜잭션 마커 레코드로 남고, 컨슈머가 `isolation.level=read_committed`이면 커밋된 트랜잭션의 메시지와 트랜잭션이 아닌 메시지만 받아 abort된 것은 보이지 않습니다. 기본값은 `read_uncommitted`라 abort된 것도 보입니다. 대신 `read_committed`는 마지막 안정 오프셋(LSO)까지만 읽어서, 진행 중인 트랜잭션 뒤의 메시지는 그 트랜잭션이 끝날 때까지 보류됩니다. 이 흐름의 컨슈머는 `enable.auto.commit=false`로 둬야 합니다.

(공식 문서) Design 문서의 Using Transactions 절은 트랜잭션이 프로듀서에만 있고, 프로듀서가 컨슈머의 위치(커밋 오프셋)도 트랜잭션으로 갱신할 수 있어 전체적으로 exactly-once 동작이 가능하다고 설명한다. 컨슈머는 `isolation.level=read_committed`와 `enable.auto.commit=false`를 설정하고, 프로듀서는 `transactional.id`를 설정하며 재시작한 앱이 이전 인스턴스의 진행 중 트랜잭션을 중단시키게 한다고 한다. 트랜잭션 결과는 마커 레코드로 기록되어 read-committed 컨슈머가 abort된 레코드를 보지 않으며, 중단 후에는 컨슈머 위치를 명시적으로 되돌려야 한다고 한다. 컨슈머 인스턴스마다 프로듀서 인스턴스 하나를 쓰라고 권고한다.
(공식 문서) 컨슈머 설정 문서는 `isolation.level` 기본값이 `read_uncommitted`이고, `read_committed`에서는 마지막 안정 오프셋(LSO, 첫 진행 중 트랜잭션 오프셋보다 하나 작은 값)까지만 반환해 진행 중 트랜잭션 뒤의 메시지가 보류되고 high watermark까지 읽지 못한다고 한다. 프로듀서 설정 문서는 `transactional.id`가 있으면 멱등성이 암묵적으로 켜지고 기본적으로 트랜잭션에는 브로커 3대 이상 클러스터가 필요하다고 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너) / kafka-clients 4.3.1(Corretto 21): 컨슈머 설정 클래스의 `isolation.level` 기본값은 `read_uncommitted`였다. 트랜잭션 프로듀서로 t1·t2를 커밋하고 a1·a2를 중단한 뒤 트랜잭션 없는 프로듀서로 n1을 쓰자(트랜잭션 마커가 오프셋 2와 5를 차지해 레코드 오프셋은 0, 1 / 3, 4 / 6), `read_uncommitted`는 t1, t2, a1, a2, n1을 모두 받았고 `read_committed`는 t1, t2, n1만 받았다.
(실험 확인) 같은 환경에서 트랜잭션을 연 채(o1, 오프셋 7) 트랜잭션 없는 프로듀서로 n2(오프셋 8)를 쓰자, `read_uncommitted`는 o1과 n2를 받고 `endOffsets`가 9였지만 `read_committed`는 새 레코드를 받지 못했고 `endOffsets`가 7(마지막 안정 오프셋)이었다. 트랜잭션을 커밋하자 `read_committed`가 o1과 n2를 받았고 `endOffsets`는 10(커밋 마커 포함)이었다. 진행 중인 트랜잭션 뒤의 비트랜잭션 레코드도 보류된다는 설명과 맞았다.
(실험 확인) `sendOffsetsToTransaction`으로 그룹 오프셋 7을 넣은 트랜잭션은 열려 있는 동안과 중단 뒤에는 `Admin`의 그룹 오프셋 조회에 아무것도 없었고, 커밋 뒤에는 오프셋 7이 나타났다. 이 브로커는 `transaction.state.log.replication.factor`와 `transaction.state.log.min.isr`을 1로 덮어 쓴 환경이라(기본 3과 2) 단일 브로커에서 트랜잭션이 동작했으며, 기본값으로는 브로커 3대가 필요하다는 문서 서술은 시험하지 않았다. `transactional.id`가 멱등성을 암묵적으로 켜는 것과 `enable.auto.commit=false` 필요성은 확인하지 않았다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
