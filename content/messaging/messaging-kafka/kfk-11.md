---
slug: "kfk-11"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "Kafka의 복제는 어떻게 이뤄지고, 리더·팔로워와 ISR은 무엇인가요?"
keywords: ["파티션 단위 복제", "리더가 쓰기 처리", "팔로워가 리더에서 가져옴", "ISR 동기화된 복제본", "커밋된 메시지만 컨슈머에 전달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/configuration/broker-configs/", "https://kafka.apache.org/43/getting-started/introduction/"]
concepts: [delivery-guarantee, high-availability]
importance: 2
links: [{to: "kfk-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
복제 단위는 토픽 파티션입니다. 파티션마다 리더 하나와 0개 이상의 팔로워가 있고, 리더를 포함한 복제본 수가 복제 계수입니다. 쓰기는 모두 리더로 가고, 팔로워는 일반 컨슈머처럼 리더에서 메시지를 가져와 자기 로그에 적용해 같은 오프셋과 같은 순서의 로그를 가집니다. 리더는 동기화된 복제본 집합인 ISR을 관리하는데, 팔로워가 컨트롤러와의 세션을 잃거나 `replica.lag.time.max.ms`(기본 30초) 안에 따라잡지 못하면 ISR에서 빠집니다. ISR 전체가 받은 메시지가 커밋된 것이고 컨슈머에게는 커밋된 메시지만 전달되며, 리더가 죽으면 ISR 안에서 새 리더가 뽑힙니다.

(공식 문서) Design 문서의 Replication 절은 복제 단위가 토픽 파티션이고 정상일 때 파티션마다 리더 하나와 0개 이상의 팔로워가 있으며, 모든 쓰기는 리더로 가고 팔로워는 일반 컨슈머처럼 리더에서 가져와 자기 로그에 적용한다고 설명한다. 브로커가 살아 있다는 조건은 컨트롤러와의 활성 세션 유지, 그리고 팔로워는 리더의 쓰기를 복제하고 너무 뒤처지지 않는 것이며, 이 둘을 만족하는 복제본이 ISR이라고 한다. 뒤처짐은 `replica.lag.time.max.ms`로 판단하며 그 시간 안에 로그 끝을 따라잡지 못하면 ISR에서 빠진다고 한다.
(공식 문서) 같은 문서는 파티션의 모든 ISR 복제본이 로그에 적용해야 메시지가 커밋된 것이고, 컨슈머에게는 커밋된 메시지만 전달되며, 컨트롤러가 브로커 실패를 감지하면 남은 ISR 중에서 새 리더를 고른다고 한다. 브로커 설정 문서는 `replica.lag.time.max.ms` 기본값을 30000(30초)이라고 한다. 소개 문서는 운영에서 흔한 복제 계수가 3이라고 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): 토픽을 만들어 `kafka-topics.sh --describe`를 하니 `Partition: 0 Leader: 1 Replicas: 1 Isr: 1 Elr: LastKnownElr:` 형태로 파티션별 리더·복제본·ISR이 나왔다(4.3.1은 `Elr` 열도 있다). `--replication-factor 3`으로 만들자 `InvalidReplicationFactorException`(대상 복제 계수 3에 도달할 수 없고 등록된 브로커는 1대)으로 거부됐다. 브로커의 `replica.lag.time.max.ms` 기본값은 30000이었다. 이 환경의 `offsets.topic.replication.factor`는 1로 덮어 쓴 값(기본 3)이었다. 팔로워 복제, ISR 축소, 리더 선출은 브로커가 하나라 재현하지 못했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
