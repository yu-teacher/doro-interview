---
slug: "kfk-12"
topic: "messaging-kafka"
tier: TRICKY
difficulty: 3
title: "`acks=all`로 보내면 데이터 유실이 없나요? `min.insync.replicas`는 무엇이고 어떻게 함께 설정하나요?"
keywords: ["acks=all은 현재 ISR 전체", "ISR이 줄면 리더 혼자 기록", "min.insync.replicas 기본 1", "복제 계수 3과 최소 2", "NotEnoughReplicas로 쓰기 거부"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/configuration/broker-configs/", "https://kafka.apache.org/43/operations/eligible-leader-replicas/"]
concepts: [delivery-guarantee, high-availability]
importance: 2
links: [{to: "kfk-05", kind: PREREQ}, {to: "kfk-11", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`acks=all`은 할당된 모든 복제본이 아니라 그 시점의 ISR 전체가 받았다는 뜻입니다. 복제본이 둘뿐인데 하나가 ISR에서 빠지면 리더 혼자 기록해도 쓰기가 성공하고, 남은 복제본마저 죽으면 데이터를 잃을 수 있습니다. 이를 막는 것이 `min.insync.replicas`로, `acks=all`일 때 쓰기가 성공하려면 ISR이 최소 이 개수여야 하고, 모자라면 프로듀서가 `NotEnoughReplicas` 계열 예외를 받습니다. 기본값이 1이라 그대로 두면 보호가 없습니다. 문서가 드는 전형적인 조합은 복제 계수 3, `min.insync.replicas` 2, `acks=all`이며, 대가로 ISR이 최소치 아래로 줄면 쓰기를 못 해 가용성이 떨어집니다.

(공식 문서) Design 문서의 Availability and Durability Guarantees 절은 `acks=all`의 확인이 할당된 전체 복제본이 아니라 그 시점의 ISR 전체가 받는 즉시 일어난다고 하며, 복제본이 둘인 토픽에서 하나가 실패해도 `acks=all` 쓰기가 성공하지만 남은 복제본마저 실패하면 유실될 수 있다고 설명한다. 내구성을 가용성보다 우선하려면 unclean 리더 선출을 끄고 최소 ISR 크기를 지정하라고 하며, 최소 ISR은 프로듀서가 `acks=all`일 때만 효력이 있고 ISR이 그 아래로 줄면 쓰기가 불가능해지는 일관성과 가용성의 교환이라고 한다.
(공식 문서) 브로커 설정 문서(4.3)의 `min.insync.replicas` 항목은 기본값이 1이며, `acks=all`에서 ISR이 이 값보다 적으면 프로듀서가 `NotEnoughReplicas` 또는 `NotEnoughReplicasAfterAppend`를 낸다고 한다. 전형적인 시나리오로 복제 계수 3, `min.insync.replicas` 2, `acks=all`을 제시한다. 같은 항목은 Eligible Leader Replicas 기능이 켜지면 이 설정의 의미가 달라진다고 한다. Eligible Leader Replicas 문서(4.3)는 이 기능이 4.1부터 새 클러스터에서 기본 활성이고, ISR이 `min.insync.replicas`보다 작으면 하이 워터마크가 전진하지 못한다는 엄격한 규칙을 전제로 ISR 밖 복제본이 리더 후보가 될 수 있게 한다고 설명한다. 그 선출 세부는 이 답변의 범위 밖이라 다루지 않았다. 브로커 설정·Design 문서는 acks 설정과 무관하게 메시지가 ISR 전체에 복제되고 `min.insync.replicas` 조건을 만족해야 컨슈머에게 보인다고도 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): `min.insync.replicas` 기본값은 브로커·토픽 모두 1이었다(`--describe --all`). 복제 계수 1인 토픽에서 `min.insync.replicas`를 2로 만들고 다시 3으로 바꿔도 kafka-clients 4.3.1(Corretto 21) 프로듀서가 `acks=all`(멱등성 켠 경우와 끈 경우 모두)로 보낸 쓰기가 성공했고 `NotEnoughReplicas` 예외는 나지 않았다. ISR 크기(1)가 설정값보다 작은데도 거부되지 않아 문서의 예외 서술을 이 단일 브로커 환경에서는 재현하지 못했다. 원인(예를 들어 유효 최소 ISR이 복제본 수로 제한되는지)은 확인하지 못했다 [미검증]. 복제본을 늘리거나 팔로워를 멈출 수 없어 ISR이 줄어드는 상황도 만들지 못했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
