---
slug: "kfk-06"
topic: "messaging-kafka"
tier: BASIC
difficulty: 1
title: "Kafka는 메시지를 소비한 뒤에도 보관하나요? 보존(retention) 기본값은 무엇인가요?"
keywords: ["소비해도 삭제하지 않음", "기본 7일 보존", "retention.ms와 retention.bytes", "세그먼트 단위 삭제", "오프셋을 되돌려 재소비"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://kafka.apache.org/43/getting-started/introduction/", "https://kafka.apache.org/43/configuration/topic-configs/", "https://kafka.apache.org/43/implementation/log/", "https://kafka.apache.org/43/design/design/"]
concepts: [messaging]
importance: 2
links: [{to: "kfk-14", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
네, Kafka는 읽혔는지와 상관없이 토픽의 이벤트를 보관하고 보존 설정이 지나야 지웁니다. 보존 시간 `retention.ms`의 기본값은 7일이고, 크기 기준 `retention.bytes`의 기본값은 -1이라 크기 제한이 없습니다. 삭제는 레코드 하나씩이 아니라 로그 세그먼트 단위로 이뤄지고, 시간과 크기 정책을 둘 다 켜면 둘 중 하나라도 해당하는 세그먼트가 삭제됩니다. 컨슈머는 자기 위치만 관리하므로 버그를 고친 뒤 오프셋을 되돌려 같은 데이터를 다시 소비할 수 있습니다. 다만 컨슈머가 보존 기간보다 오래 멈춰 있으면 읽을 데이터가 이미 삭제됐을 수 있습니다.

(공식 문서) 소개 문서는 토픽의 이벤트를 필요한 만큼 여러 번 읽을 수 있고 소비 후 삭제되지 않으며, 보존 기간은 토픽별 설정이라고 한다. 토픽 설정 문서(4.3)는 `retention.ms` 기본값이 604800000(7일)이고 컨슈머가 데이터를 읽어야 하는 기한에 대한 SLA 같은 것이라고 하며, `retention.bytes`의 기본값은 -1로 기본은 시간 제한만 있고 크기 제한이 없다고 한다. 크기 제한은 파티션 단위로 적용된다고 한다.
(공식 문서) Log 구현 문서는 데이터가 로그 세그먼트 단위로 삭제되고, 시간 정책은 세그먼트 안 최대 타임스탬프로 판단하며, 크기 정책은 기본 비활성이고, 둘이 동시에 켜지면 어느 한쪽이라도 해당하는 세그먼트가 삭제된다고 설명한다. Design 문서는 컨슈머가 오래된 오프셋으로 되돌아가 재소비할 수 있다고 하고, Log 문서는 존재하지 않는 오프셋을 읽으려 하면 범위 초과 예외를 받는다고 한다.
(실험 확인) Kafka 4.3.1 단일 브로커(KRaft, 컨테이너): 보존 설정 없이 만든 토픽을 `kafka-configs.sh --describe --all`로 보니 `retention.ms=604800000`, `retention.bytes=-1`, `cleanup.policy=delete`였고 브로커는 `log.retention.hours=168`, `log.retention.check.interval.ms=300000`(5분), `log.segment.delete.delay.ms=60000`이었다.
(실험 확인) 같은 환경에서 `segment.ms=2000`, `retention.ms=10000`인 토픽에 5개를 세 번에 나눠 써서 세그먼트 세 개(기준 오프셋 0, 3, 4)를 만들고 약 13분 뒤 확인하니 전부 삭제되어 `kafka-get-offsets.sh`의 가장 이른 오프셋이 5(로그 끝과 같음)였다. 보존 시간 10초가 지나자마자 지워지지 않고 브로커의 보존 검사 주기 뒤에 지워졌고, 정확한 삭제 시각은 재지 못했다.
(실험 확인) 같은 환경에서 `retention.bytes=100`, `segment.ms=2000`인 토픽(시간 보존은 기본 7일)에 5개씩 네 번(세그먼트 기준 오프셋 0, 5, 10, 15)에 나눠 써서 로그 끝 오프셋이 20이 된 뒤 약 3분 만에 확인하니 가장 이른 오프셋이 15였다. 시간 보존이 도래하지 않았는데도 크기 기준만으로 세그먼트 단위(0, 5, 10 세그먼트 파일이 `.deleted`로 바뀜)로 지워졌고 마지막 세그먼트는 남았다. 두 정책 동시 설정은 시간 쪽을 비운 채 크기 정책 하나만 시험한 것이므로 어느 한쪽이 해당하면 삭제된다는 서술의 한 방향만 확인했다.
(실험 확인) 삭제된 오프셋 0으로 `seek`한 kafka-clients 4.3.1(Corretto 21) 컨슈머는 `auto.offset.reset=none`이면 `OffsetOutOfRangeException`(Fetch position ... is out of range)을 받았고, `earliest`와 `latest`면 예외 없이 위치가 재설정됐다. 그 토픽은 가장 이른 오프셋과 로그 끝이 둘 다 5라 구분이 안 됐는데, 재검증에서 가장 이른 오프셋 15, 로그 끝 20인 토픽으로 하니 `earliest`는 15부터 5개를 받았고 `latest`는 하나도 받지 않고 20으로 갔다. 소비 후에도 데이터가 남는다는 점은 다른 질문의 실험에서 새 그룹이 같은 레코드를 처음부터 다시 읽은 것으로 확인했다.
위 (실험 확인)으로 적지 않은 서술은 실험하지 않았고 문서 서술에만 근거한다.
