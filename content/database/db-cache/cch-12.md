---
slug: "cch-12"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "Redis 복제는 동기식인가요? 마스터가 죽으면 이미 성공 응답을 받은 데이터가 사라질 수 있나요?"
keywords: ["기본 비동기 복제", "복제본은 읽기 전용", "WAIT로 확인 응답 대기", "WAIT도 강한 일관성 아님", "만료는 마스터의 DEL 전달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/operate/oss_and_stack/management/replication/", "https://redis.io/docs/latest/commands/expire/", "https://redis.io/docs/latest/commands/wait/"]
---
**모범 답변 (30~60초)**
Redis 복제는 기본적으로 비동기입니다. 마스터는 쓰기를 처리하고 복제본의 처리를 기다리지 않고 명령 스트림을 보내므로, 복제본에 전달되기 전에 마스터가 죽고 그 복제본이 승격되면 클라이언트가 성공 응답을 받은 쓰기도 사라질 수 있습니다. 클라이언트가 `WAIT`로 지정한 수의 복제본이 받았음을 확인할 때까지 기다릴 수 있지만, 문서는 이것이 강한 일관성을 가진 CP 시스템을 만들어 주지는 않고 유실 가능성을 크게 낮출 뿐이라고 합니다. 복제본은 기본적으로 읽기 전용이라 읽기 부하를 나누는 데 쓰고, 키 만료는 복제본이 독자적으로 하지 않고 마스터가 보내는 DEL을 따릅니다.

```
SET k v
WAIT 1 100     # 복제본 1대의 확인을 최대 100ms 기다린 뒤 확인한 복제본 수를 반환
```

(공식 문서) Replication 페이지는 기본이 비동기 복제이고 복제본이 처리한 양을 비동기로 마스터에 알리며, `WAIT`로 동기 복제를 요청할 수 있지만 확인된 쓰기가 페일오버에서 여전히 사라질 수 있어 CP 시스템이 되지는 않는다고 한다. 마스터는 복제본이 초기 동기화를 하는 동안에도 쿼리를 처리하고(마스터 쪽 논블로킹), 복제본은 읽기 부하를 분산하는 용도로 쓸 수 있고 2.6부터 읽기 전용이 기본이다. WAIT 문서는 `WAIT numreplicas timeout`이 지정한 수의 복제본이 이전 쓰기를 확인할 때까지(타임아웃은 밀리초) 클라이언트를 막고, 확인한 복제본 수를 돌려주며, 강한 일관성을 만들지는 않아 여러 복제본에 동기 복제된 쓰기도 잃을 수 있다고 한다. 연결이 끊기면 부분 재동기화를 시도하고 불가능하면 전체 재동기화를 한다. EXPIRE 문서는 복제본이 만료를 독자적으로 하지 않고 마스터가 합성한 DEL을 기다린다고 한다.
(실험 확인) Redis 7.4.11 컨테이너 두 개(마스터와 `--replicaof` 복제본)를 사용자 정의 네트워크에 띄우자 `connected_slaves:1`, 복제본 `master_link_status:up`이었고, 마스터에 `SET k v` 뒤 `WAIT 1 100`은 1을 돌려줬으며 복제본에서 `GET k`가 `v`였다. 복제본에 `SET`하면 `READONLY You can't write against a read only replica.`이 났다. 마스터에 `PX 300`으로 건 키는 0.6초 뒤 복제본의 `GET`이 비어 있었다. 복제본 컨테이너를 `docker stop`으로 내린 뒤 `WAIT 1 200`은 0을 돌려줬다. 실제로 쓰기가 유실되는 페일오버는 재현하지 않았다.
