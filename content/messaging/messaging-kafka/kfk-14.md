---
slug: "kfk-14"
topic: "messaging-kafka"
tier: DEEP
difficulty: 2
title: "로그 컴팩션(compaction)은 무엇이고, 시간 기반 삭제와 어떻게 다르며 톰스톤은 무엇인가요?"
keywords: ["키별 최신 값 유지", "cleanup.policy compact", "시간 기반 삭제 정책과의 차이", "값이 null인 톰스톤", "오프셋은 바뀌지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/design/design/", "https://kafka.apache.org/43/configuration/broker-configs/", "https://kafka.apache.org/43/configuration/topic-configs/"]
concepts: [messaging]
importance: 1
---
**모범 답변 (30~60초)**
기본 정책(`delete`)은 보존 시간이나 크기가 지난 오래된 세그먼트를 버립니다. 로그 컴팩션(`cleanup.policy=compact`)은 시간이 아니라 키 기준으로, 같은 키의 더 새로운 레코드가 있으면 이전 레코드를 지워서 키마다 최소한 마지막 값은 남깁니다. 그래서 DB 변경 로그나 캐시 복원처럼 최종 상태를 다시 만들어야 하는 용도에 맞습니다. 값이 null인 레코드는 톰스톤이라 불리는 삭제 표시로, 그 키의 이전 레코드를 지우게 하고 자신도 `delete.retention.ms`(기본 1일)가 지나면 정리됩니다. 컴팩션은 순서를 바꾸지 않고 남은 레코드의 오프셋도 그대로이며, 두 정책을 함께 지정할 수도 있습니다.

(공식 문서) Design 문서의 Log Compaction 절은 컴팩션이 토픽 파티션 로그에서 메시지 키마다 최소한 마지막 값을 유지하는 것을 보장하고, 시간 기반 보존보다 세밀한 레코드 단위 보존이라고 설명한다. 키와 null 페이로드를 가진 메시지는 삭제로 취급되는 톰스톤이고 일정 시간 뒤 자신도 정리되며, 순서는 바뀌지 않고 오프셋은 영구 식별자로 바뀌지 않으며, `delete.retention.ms`(기본 24시간)보다 늦게 따라잡는 컨슈머는 삭제 표시를 놓칠 수 있다고 한다. 컴팩션은 로그 클리너 스레드가 백그라운드에서 세그먼트를 다시 복사하며, 최소 컴팩션 지연을 설정하지 않으면 현재 쓰는 마지막 세그먼트를 뺀 나머지가 대상이라고 한다.
(공식 문서) 브로커 설정 문서(4.3)의 `log.cleanup.policy` 항목은 기본이 `delete`이고 `compact`를 지정하면 컴팩션이 켜지며 `delete,compact`처럼 둘을 함께 지정하면 삭제 정책에 따라 오래된 세그먼트를 버리면서 남은 세그먼트를 압축한다고 한다. 토픽 설정 문서는 `delete.retention.ms` 기본값이 1일이라고 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): 브로커의 `log.cleanup.policy` 기본값은 `delete`였고 토픽의 `delete.retention.ms` 기본값은 86400000(1일)이었다. `cleanup.policy=compact,delete`로 토픽을 만들 수 있었고 `--describe`에 그대로 표시됐다.
(실험 확인) 같은 환경에서 `cleanup.policy=compact`, `segment.ms=1000`, `min.cleanable.dirty.ratio=0.01`, `delete.retention.ms=1000`인 토픽에 오프셋 0~8로 k1:v1, k2:v1, k1:v2, k3:v1, k2:null(톰스톤), k1:v3, k4:v1, k1:v4, k5:v1을 쓰고 1분 남짓 뒤 읽으니 오프셋 3(k3:v1), 6(k4:v1), 7(k1:v4), 8(k5:v1)만 남았다. 오프셋은 바뀌지 않고 연속이 아니었으며 순서도 유지됐고, k2의 톰스톤도 사라졌다. 로그 끝 오프셋은 9였다. 재검증에서는 톰스톤이 `delete.retention.ms` 1초인데도 새 쓰기가 없는 10분 넘게 남았고, 더 써서 클리너가 다시 돈 뒤에야 사라졌다. 제거 시점은 다음 정리 시점에도 달려 있다.
(실험 확인) `delete.retention.ms=600000`으로 같은 시험을 하니 k1:v2(오프셋 2)와 k2의 톰스톤(오프셋 3, 값 null)이 남아 있었고, 마지막 세그먼트의 같은 키 두 레코드(k9의 x와 y, 오프셋 4와 5)는 정리되지 않았다(문서가 말한 대로 현재 쓰는 마지막 세그먼트는 대상이 아님). 컴팩션이 실제로 돈 시점은 로그 클리너 대기 시간(`log.cleaner.backoff.ms=15000`) 안팎의 이 환경 값일 뿐 일반 수치가 아니다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
