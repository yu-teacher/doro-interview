---
slug: "rmq-06"
topic: "messaging-rabbitmq"
tier: BASIC
difficulty: 1
title: "RabbitMQ에서 컨슈머가 메시지를 처리하다 죽으면 메시지는 어떻게 되나요? 확인 응답(ack)은 왜 필요한가요?"
keywords: ["처리 후 ack", "ack 전에 죽으면 재큐잉", "자동 ack는 전달 즉시 삭제", "다른 컨슈머에게 재전달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rabbitmq.com/tutorials/tutorial-two-java"]
concepts: [delivery-guarantee]
importance: 3
links: [{to: "rmq-07", kind: FOLLOWUP}, {to: "rmq-21", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
컨슈머가 작업을 끝낸 뒤 브로커에 ack를 보내야 브로커가 그 메시지를 지웁니다. ack 없이 컨슈머의 채널이나 연결이 끊기면 브로커는 처리가 끝나지 않았다고 보고 메시지를 다시 큐에 넣고, 다른 컨슈머가 살아 있으면 그쪽으로 곧바로 재전달합니다. 반대로 자동 ack(`autoAck=true`)는 전달하자마자 삭제 대상으로 표시하기 때문에 처리 중에 컨슈머가 죽으면 메시지를 잃습니다. 그래서 작업이 중요하면 수동 ack를 쓰고 처리가 끝난 뒤에 ack합니다. 이 구조에서는 같은 메시지가 다시 전달될 수 있습니다.

(공식 문서) 튜토리얼 2는 자동 ack에서는 브로커가 메시지를 컨슈머에 전달하는 즉시 삭제 표시를 하므로 워커가 죽으면 처리 중이던 메시지와 아직 처리 못한 메시지를 잃는다고 설명한다. 확인 응답은 메시지를 받아 처리했으니 지워도 된다고 알리는 것이고, ack 없이 채널·연결·TCP 연결이 닫히면 브로커가 재큐잉하며 다른 컨슈머가 있으면 빠르게 재전달한다고 한다.
(실험 확인) RabbitMQ 4.4.0에서 수동 ack 컨슈머가 3건을 받고 ack 없이 연결을 끊자 관리 API가 unacked 3에서 ready 3으로 바뀌었고, 새 컨슈머가 같은 3건을 `redelivered` 플래그 true로 다시 받았다. 같은 메시지가 컨슈머에게 두 번 전달된 것이므로 재전달이 곧 중복 처리 가능성이라는 추론도 이 범위에서 확인됐다(멱등 처리는 rmq-21). 자동 ack(`autoAck=true`) 컨슈머가 3건을 받고 곧바로 연결을 끊자 큐에 남은 메시지는 0건이었다(유실). `basic.reject`(requeue=true) 직후 다시 받은 메시지는 `redelivered`가 true였고 첫 전달은 false였다. 다른 컨슈머가 살아 있을 때의 즉시 재전달은 따로 보지 않았다. 관리 API 수치는 갱신 주기(약 5초)를 기다린 뒤 읽었다.
