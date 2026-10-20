---
slug: "cch-21"
topic: "db-cache"
tier: TRICKY
difficulty: 2
title: "Redis는 싱글 스레드로 명령을 처리하는데도 왜 동시성 문제가 생기나요?"
keywords: ["명령 하나는 원자적", "GET 후 SET은 별개 명령", "갱신 손실", "INCR 같은 원자 명령", "WATCH 또는 Lua로 묶기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/using-commands/transactions/", "https://redis.io/docs/latest/develop/programmability/eval-intro/", "https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/", "https://redis.io/docs/latest/develop/get-started/faq/"]
---
**모범 답변 (30~60초)**
단일 스레드가 보장하는 것은 명령 하나가 실행되는 동안 다른 명령이 끼어들지 않는다는 점이지, 여러 명령의 묶음이 원자적이라는 뜻이 아닙니다. 클라이언트가 값을 `GET`으로 읽고 애플리케이션에서 1을 더해 `SET`으로 쓰면, 두 클라이언트가 같은 값 10을 읽은 뒤 각자 11을 써서 최종값이 12가 아닌 11이 되는 갱신 손실이 생깁니다. 이런 읽기-수정-쓰기는 `INCR`처럼 서버가 한 명령으로 처리하는 원자 명령을 쓰거나, 충돌을 감지하는 `WATCH` 트랜잭션, 서버 안에서 한 덩어리로 실행되는 Lua 스크립트로 묶어야 합니다. 트랜잭션 문서의 `WATCH` 예제가 바로 이 경쟁 조건을 설명합니다.

```
GET cnt        # A: 10
GET cnt        # B: 10
SET cnt 11     # A
SET cnt 11     # B  -> 최종 11 (갱신 손실)

INCR cnt       # 서버가 읽고 더하고 쓰는 것을 한 명령으로 처리 -> 두 번이면 12
```

(공식 문서) Transactions 페이지는 `GET`, 값에 1 더하기, `SET`의 흐름이 여러 클라이언트에서 경쟁 조건을 만들어 최종값이 12가 아닌 11이 될 수 있다고 설명하고, `WATCH`로 낙관적 락을 걸 수 있다고 한다. 지연 진단 문서는 하나의 스레드가 요청을 순차로 처리한다고 하며, Scripting 페이지는 스크립트가 원자적으로 실행된다고 하며, FAQ는 Redis 자료형에 원자 연산이 정의되어 있다고 설명한다.
(실험 확인) Redis 7.4.11에서 값 10인 키에 대해 `GET` 두 번(둘 다 10) 뒤 `SET 11`을 두 번 하자 최종값이 11이었고, 10에서 `INCR`을 두 번 하자 12였다. 두 클라이언트의 끼어들기는 별도의 `redis-cli` 호출을 위 순서대로 실행해 흉내 냈다(실제 병렬 실행은 아니다).
