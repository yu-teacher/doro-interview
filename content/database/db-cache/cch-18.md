---
slug: "cch-18"
topic: "db-cache"
tier: TRICKY
difficulty: 3
title: "Redis로 분산 락을 만들 때 `SET NX PX`와 값을 확인한 뒤 삭제하는 Lua 스크립트를 같이 쓰는 이유는 무엇인가요?"
keywords: ["SET NX PX 원자적 획득", "TTL로 데드락 방지", "고유 랜덤 값", "값 확인 후 삭제는 Lua", "DEL만 쓰면 남의 락 삭제"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/", "https://redis.io/docs/latest/commands/set/", "https://redis.io/docs/latest/develop/programmability/eval-intro/"]
---
**모범 답변 (30~60초)**
락 획득은 `SET 키 고유값 NX PX 시간` 한 명령으로 합니다. 키가 없을 때만 설정되어 한 클라이언트만 성공하고, 만료 시간이 있어 락을 쥔 클라이언트가 죽어도 결국 풀립니다. 값에 클라이언트와 요청마다 고유한 랜덤 값을 넣는 이유는 해제 때문입니다. 작업이 TTL보다 오래 걸려 락이 만료되고 다른 클라이언트가 새로 잡았는데 그냥 `DEL`을 하면 남의 락을 지우게 됩니다. 그래서 값이 내가 넣은 것일 때만 지우도록 읽기와 삭제를 Lua 스크립트 하나로 묶어 원자적으로 실행합니다. 문서는 Redis 8.4의 `DELEX`로 대체할 수 있다고 하지만 그 이전 버전에서는 스크립트가 필요합니다.

```
SET resource_name my_random_value NX PX 30000
```

```lua
if redis.call("get",KEYS[1]) == ARGV[1] then
    return redis.call("del",KEYS[1])
else
    return 0
end
```

(공식 문서) Distributed Locks 페이지에 근거한다. 단일 인스턴스에서 올바른 획득은 `SET resource_name my_random_value NX PX 30000`이고 값은 모든 클라이언트와 락 요청에서 유일해야 하며, 해제는 값이 내가 기대한 값일 때만 키를 지우는 스크립트로 하라고 한다. 그냥 `DEL`은 다른 클라이언트의 락을 지울 수 있다고 경고하고, Redis 8.4에 `DELEX key IFEQ value`가 도입됐으며 이전 버전은 위 Lua 스크립트를 쓰라고 한다. 락의 유효 시간은 자동 해제 시간이자 그동안 상호 배제가 보장되는 구간이다. 단일 인스턴스 방식은 가끔 경쟁이 허용되는 경우에 적합하다고 한다.
(실험 확인) Redis 7.4.11에서 `SET cch:lock tokenA NX PX 400`은 `OK`, 이어서 tokenB로 같은 명령은 nil이었다. 0.6초가 지나 만료된 뒤 tokenB가 `NX`로 잡자 성공했고, 이때 tokenA가 그냥 `DEL`을 하면 1을 반환하며 tokenB의 락이 사라졌다. 다시 tokenB로 잡고 위 스크립트로 tokenA가 해제하면 0(삭제 안 함)이고 락이 남았으며, tokenB가 해제하면 1이었다.
