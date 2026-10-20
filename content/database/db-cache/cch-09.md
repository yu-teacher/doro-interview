---
slug: "cch-09"
topic: "db-cache"
tier: DEEP
difficulty: 3
title: "Redis에서 읽고 계산해 쓰는 작업을 원자적으로 하려면 `WATCH`와 Lua 스크립트는 각각 어떻게 쓰고 무엇이 다른가요?"
keywords: ["WATCH 낙관적 락", "키가 바뀌면 EXEC가 nil", "충돌 시 재시도", "Lua 스크립트 원자 실행", "KEYS 인자로 키 전달", "EVALSHA와 NOSCRIPT"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/using-commands/transactions/", "https://redis.io/docs/latest/develop/programmability/eval-intro/"]
---
**모범 답변 (30~60초)**
`WATCH`는 키를 감시하다가 `EXEC` 전에 다른 곳에서 그 키를 바꾸면 트랜잭션 전체를 취소하고 `EXEC`가 null을 돌려주는 낙관적 락입니다. 읽고 계산하고 `MULTI`로 쓰는 흐름에서 충돌이 나면 애플리케이션이 처음부터 재시도해야 합니다. Lua 스크립트는 서버 안에서 한 덩어리로 실행되고 그동안 다른 작업이 블록되므로 조건 분기까지 원자적으로 처리할 수 있고, 문서도 트랜잭션으로 되는 일은 스크립트로 더 간단하고 빠르게 할 수 있다고 말합니다. 스크립트가 접근하는 키는 `KEYS` 인자로 명시해야 하고, 스크립트 캐시는 휘발성이라 `EVALSHA`가 `NOSCRIPT`를 받으면 다시 올려야 합니다.

```
WATCH mykey
val = GET mykey
MULTI
SET mykey <val+1>
EXEC          # 그 사이 mykey 가 바뀌었으면 null -> 재시도
```

```
EVAL "local v=redis.call('GET',KEYS[1]); if not v then v=0 end; redis.call('SET',KEYS[1],v+tonumber(ARGV[1])); return v+tonumber(ARGV[1])" 1 counter 5
```

(공식 문서) Transactions 페이지는 `WATCH`가 `EXEC`를 조건부로 만들고, 감시 키가 `EXEC` 전에 바뀌면(클라이언트의 쓰기뿐 아니라 만료·퇴출 포함) 트랜잭션 전체가 중단되어 null이 반환되며 이를 낙관적 락이라 부르고 재시도하라고 한다. 트랜잭션으로 할 수 있는 일은 스크립트로도 할 수 있고 보통 더 단순하고 빠르다고 하며, Redis 8.4부터는 문자열 키용 비교 후 설정(`SET ... IFEQ` 등)과 `DELEX` 명령이 추가된다고 한다. Scripting 페이지는 스크립트가 원자적으로 실행되고 실행 동안 서버 활동이 블록되며, 스크립트가 접근하는 모든 키 이름은 입력 키 인자로 명시해야 하고(스탠드얼론·클러스터 모두), 스크립트 캐시는 재시작·페일오버·`SCRIPT FLUSH`로 사라질 수 있어 `EVALSHA`를 쓰는 애플리케이션이 `NOSCRIPT` 때 다시 적재해야 한다고 한다.
(실험 확인) Redis 7.4.11에서 한 연결이 `WATCH w`, `GET w`(10)를 하고 기다리는 동안 다른 연결이 `SET w 99`를 하자, 첫 연결의 `MULTI`/`SET w 11`/`EXEC`는 값을 돌려주지 않았고(null) `w`는 99로 남았다. 중간 변경이 없을 때는 `EXEC`가 성공해 11이 됐다. 위 Lua 스크립트는 5와 10을 차례로 돌려줬고, 없는 해시로 `EVALSHA`하자 `NOSCRIPT No matching script. Please use EVAL.`이 나왔다.
