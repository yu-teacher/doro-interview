---
slug: "kfk-19"
topic: "messaging-kafka"
tier: DEEP
difficulty: 3
title: "unclean leader election이란 무엇이고 기본값은 무엇인가요? 켜면 무엇을 얻고 잃나요?"
keywords: ["ISR 밖 복제본을 리더로 선출", "가용성과 일관성의 교환", "기본값 false", "커밋된 메시지 유실 가능", "ISR이 모두 죽은 경우"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/configuration/broker-configs/", "https://kafka.apache.org/43/operations/eligible-leader-replicas/"]
concepts: [delivery-guarantee, high-availability]
importance: 1
---
**모범 답변 (30~60초)**
파티션의 ISR 복제본이 모두 죽었을 때 선택지는 두 가지입니다. ISR 안의 복제본이 살아 돌아오길 기다리거나, 가장 먼저 살아난 복제본을 ISR이 아니어도 리더로 삼는 것입니다. 후자가 unclean leader election이고, 서비스는 빨리 재개되지만 그 복제본의 로그가 기준이 되어 이미 커밋된 메시지가 사라질 수 있습니다. 전자는 데이터를 지키지만 ISR 복제본이 돌아오기 전까지, 그 데이터가 영구히 없어졌다면 영원히 쓸 수 없습니다. `unclean.leader.election.enable`의 기본값은 false로, 일관성을 택한 설정입니다. 가동 시간이 데이터 보존보다 중요한 용도에서만 켭니다.

(공식 문서) Design 문서의 Unclean leader election 절은 파티션을 복제하는 노드가 모두 죽으면 데이터 손실 방지 보장이 깨진다고 하며, ISR의 복제본이 살아나길 기다려 리더로 삼는 방식과 먼저 살아난 복제본을 ISR 여부와 무관하게 리더로 삼는 방식을 가용성과 일관성의 단순한 교환으로 설명한다. 0.11.0.0부터 Kafka는 앞의 방식, 즉 일관된 복제본을 기다리는 쪽을 기본으로 하며, `unclean.leader.election.enable`로 바꿔 가동 시간을 우선할 수 있다고 한다.
(공식 문서) 브로커 설정 문서(4.3)의 `unclean.leader.election.enable` 항목은 ISR 밖 복제본을 마지막 수단으로 리더로 선출하도록 허용할지를 정하며 데이터 손실이 생길 수 있다고 하고, 기본값은 false라고 한다.
(공식 문서) Eligible Leader Replicas 문서(4.3)는 이 기능이 4.1부터 새 클러스터에서 기본 활성이고, 리더 선출 때 ISR이 비어 있지 않으면 ISR에서, 아니면 펜싱되지 않은 ELR에서, 그것도 없으면 마지막으로 알려진 리더(펜싱되지 않았다면)를 고른다고 설명한다. 위 답변은 이 기능 이전부터 서술된 Design 문서의 ISR 전부 소실 시나리오를 기준으로 한 것이다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): `kafka-configs.sh --describe --all`에서 브로커와 토픽 모두 `unclean.leader.election.enable=false`(기본값)였다. ISR이 모두 죽는 상황과 unclean 선출은 브로커 하나라 재현하지 못했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
