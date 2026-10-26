---
slug: "rmq-07"
topic: "messaging-rabbitmq"
tier: DEEP
difficulty: 2
title: "브로커를 재시작해도 메시지가 사라지지 않게 하려면 무엇을 해야 하고, 그래도 유실될 수 있는 이유는 무엇인가요?"
keywords: ["durable 큐 선언", "persistent 메시지", "디스크에 쓰기 전 짧은 시간 창", "메시지마다 fsync 안 함", "publisher confirms로 보강"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-two-java", "https://www.rabbitmq.com/tutorials/tutorial-seven-java"]
concepts: [delivery-guarantee]
importance: 2
links: [{to: "rmq-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
큐와 메시지를 둘 다 내구성 있게 만들어야 합니다. 큐는 durable로 선언해 노드가 재시작돼도 남게 하고, 메시지는 발행할 때 persistent로 표시해 디스크에 저장하도록 요청합니다. 그래도 완벽하지는 않습니다. 브로커가 메시지를 받았지만 아직 저장하지 못한 짧은 시간 창이 있고, 메시지마다 `fsync`를 하지 않아서 캐시에만 있을 수도 있습니다. 더 강한 보장이 필요하면 프로듀서 확인(publisher confirms)을 함께 씁니다. 이미 있는 큐를 다른 속성으로 다시 선언하면 오류가 나서, 튜토리얼은 새 이름의 큐를 선언하는 우회를 씁니다.

(공식 문서) 튜토리얼 2는 RabbitMQ가 종료되거나 죽으면 알려 주지 않는 한 큐와 메시지를 잊으며, 막으려면 큐를 durable로 선언하고 메시지를 persistent로 표시해야 한다고 설명한다. persistent 표시가 완전한 보장은 아니며 브로커가 메시지를 받고 아직 저장하지 못한 짧은 창이 있고, `fsync(2)`를 메시지마다 하지 않아 캐시에만 있을 수 있다고 한다. 더 강한 보장은 publisher confirms를 쓰라고 안내한다. 기존 큐를 다른 파라미터로 재정의하는 것은 허용되지 않아 오류가 난다는 설명도 있다.
(공식 문서) 튜토리얼 7은 publisher confirms가 발행한 메시지를 브로커가 맡았다는 것을 알려 주는 신뢰성 있는 발행용 확장이라고 설명한다.
(공식 문서) 튜토리얼 코드는 큐를 `x-queue-type`을 `quorum`으로 하고 durable=true로 선언한다. 큐 타입별 내구성 차이는 RabbitMQ 큐 문서를 읽지 못해 다루지 않는다.
(실험 확인) RabbitMQ 4.4.0에서 큐를 durable로 선언하고 메시지를 delivery_mode 2(persistent)와 1(transient)로 발행해 관리 API로 읽으면 속성이 그대로 2와 1로 보였다. 이미 있는 durable 큐를 `durable=false`로 다시 선언하면 채널이 `406 PRECONDITION_FAILED - inequivalent arg 'durable'`로 닫혔다. 또 4.4.0 기본 설정에서는 durable도 exclusive도 아닌 큐나 durable이 아닌 quorum 큐를 선언하면 연결이 `541 INTERNAL_ERROR`(`transient_nonexcl_queues` 기능이 deprecated라 기본으로 허용되지 않는다는 메시지)로 닫혔다. exclusive 큐는 선언한 연결이 닫히자 사라졌다(관리 API 404). 브로커 재시작은 컨테이너를 중지할 수 없어 하지 않았으므로, 재시작 뒤 생존 여부와 `fsync` 시간 창은 문서 근거만 적었다.
