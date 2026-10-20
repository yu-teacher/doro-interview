---
slug: "cch-20"
topic: "db-cache"
tier: TRICKY
difficulty: 2
title: "Redis Pub/Sub 메시지는 구독자가 없거나 연결이 끊겼을 때 어떻게 되고, 더 강한 전달 보장이 필요하면 무엇을 쓰나요?"
keywords: ["최대 한 번 전달", "구독자 없으면 소실", "끊기면 메시지 영구 손실", "Streams는 메시지 영속", "RESP2 구독 중 일부 명령만"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/pubsub/"]
---
**모범 답변 (30~60초)**
Redis Pub/Sub는 채널을 구독 중인 클라이언트에게 발행 시점에 메시지를 밀어 주는 방식이고, 전달 의미는 최대 한 번, 즉 at-most-once입니다. 서버가 메시지를 한 번 내보내면 재전송이 없어서, 구독자가 오류를 겪거나 연결이 끊기면 그 메시지는 영영 사라집니다. 구독자가 없는 채널에 발행하면 아무에게도 전달되지 않고 나중에 구독한 쪽도 과거 메시지를 받을 수 없습니다. 더 강한 전달 보장이 필요하면 문서는 Redis Streams를 보라고 하는데, 스트림의 메시지는 저장되고 최대 한 번과 최소 한 번 전달을 모두 지원합니다. 또 RESP2에서는 구독 중인 연결이 SUBSCRIBE류와 PING 같은 일부 명령만 쓸 수 있습니다.

```
SUBSCRIBE channel11 ch:00      # 구독 연결
PUBLISH channel11 hello        # 발행: 받은 구독자 수를 반환
```

(공식 문서) Pub/Sub 페이지는 발행자와 구독자가 서로를 모르는 채널 기반 메시징이고, 구독자는 발행 순서대로 메시지를 받으며, 전달 의미는 최대 한 번이라 서버가 보낸 뒤 재전송이 없고 구독자가 처리하지 못하거나 연결이 끊기면 메시지가 영영 사라진다고 한다. 더 강한 보장은 메시지가 영속되고 최대 한 번과 최소 한 번을 모두 지원하는 Streams를 보라고 한다. RESP2에서 구독 상태의 클라이언트가 쓸 수 있는 명령은 PING, (P/S)SUBSCRIBE, (P/S)UNSUBSCRIBE, QUIT, RESET이고 RESP3는 제한이 없다.
(실험 확인) Redis 7.4.11에서 구독자가 없을 때 `PUBLISH cch:ch before-sub`는 0을 돌려줬다. 그 뒤 `redis-cli SUBSCRIBE cch:ch` 연결이 열려 있는 동안의 `PUBLISH cch:ch hello`는 1을 돌려줬고 구독자는 `hello`만 받았다(그 이전 메시지는 받지 못함). 구독 연결이 종료된 뒤의 `PUBLISH`는 0을 돌려줘 받을 구독자가 없었다. RESP2로 구독 중인 연결에서 `GET`을 보내자 `only (P|S)SUBSCRIBE / (P|S)UNSUBSCRIBE / PING / QUIT / RESET are allowed in this context` 오류가 났고 `PING`은 `pong`이었다. 연결이 끊기는 순간에 전송 중이던 메시지가 어떻게 되는지는 실험하지 않았고, 그 부분은 문서의 설명이다.
