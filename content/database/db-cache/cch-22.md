---
slug: "cch-22"
topic: "db-cache"
tier: TRICKY
difficulty: 3
title: "`@Transactional` 메서드 안에서 `RedisTemplate`으로 쓴 값은 DB 트랜잭션처럼 롤백되나요?"
keywords: ["기본 RedisTemplate은 트랜잭션 미참여", "setEnableTransactionSupport", "성공 시 EXEC 실패 시 DISCARD", "트랜잭션 중 쓰기는 큐잉", "Redis는 롤백 없음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/redis/reference/redis/transactions.html", "https://redis.io/docs/latest/develop/using-commands/transactions/"]
concepts: [tx-boundary, redis]
importance: 1
links: [{to: "cch-08", kind: PREREQ}, {to: "tx-19", kind: RELATED}, {to: "dst-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
기본 상태에서는 롤백되지 않습니다. `RedisTemplate`은 스프링이 관리하는 트랜잭션에 참여하지 않으므로 `@Transactional` 안에서 쓴 값은 바로 Redis에 반영되고, 이후 예외로 롤백돼도 남습니다. 템플릿마다 `setEnableTransactionSupport(true)`를 켜야 현재 트랜잭션에 연결이 묶이고, 그러면 쓰기 명령이 큐에 쌓였다가 트랜잭션이 정상 종료되면 `EXEC`로 반영되고 실패하면 `DISCARD`됩니다. 다만 이 롤백은 아직 실행하지 않은 큐를 버리는 것이지 실행된 명령을 되돌리는 것이 아니고, 트랜잭션 중에는 방금 쓴 값을 읽어도 보이지 않습니다. DB 커밋과 Redis 커밋은 별개라 둘이 원자적으로 묶이지는 않습니다.

```java
StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
template.setEnableTransactionSupport(true);   // 켜야 @Transactional 에 참여
```

(공식 문서) Spring Data Redis의 Transactions 페이지는 기본 `RedisTemplate`이 관리되는 Spring 트랜잭션에 참여하지 않으며 `@Transactional`이나 `TransactionTemplate`에서 Redis 트랜잭션을 쓰려면 템플릿마다 `setEnableTransactionSupport(true)`를 명시해야 한다고 한다. 켜면 `RedisConnection`이 `ThreadLocal`로 현재 트랜잭션에 묶이고, 오류 없이 끝나면 `EXEC`로 커밋, 아니면 `DISCARD`로 롤백한다. Redis 트랜잭션은 배치 지향이라 진행 중 명령은 큐에 쌓였다가 커밋 때 적용되며, `KEYS` 같은 읽기 전용 명령은 새 연결로 보내 읽을 수 있게 한다고 한다. `MULTI`와 `EXEC` 사이에서 예외가 나면 연결이 트랜잭션 상태에 걸릴 수 있어 `DISCARD`가 필요하다고도 설명한다. Redis 자체에 롤백이 없다는 점은 Redis Transactions 페이지에 있다.
(실험 확인) Spring Data Redis 4.1.0, Spring Framework 7.0.9, Redis 7.4.11에서 `@Transactional` 대신 같은 메커니즘인 `TransactionTemplate`과 자원 없는 최소 `PlatformTransactionManager`를 썼다. 기본 템플릿으로 쓰고 예외를 던져 롤백하게 하자 키가 `1`로 남았다. `setEnableTransactionSupport(true)` 템플릿은 같은 상황에서 키가 생기지 않았고(null), 롤백 없이 끝낸 경우 트랜잭션 안에서는 다른 연결도 같은 템플릿도 값을 볼 수 없다가(null) 커밋 뒤 `1`이 보였다. 실제 DB 트랜잭션 매니저와의 조합은 실험하지 않았다.
(보충) DB와 Redis가 서로 다른 자원이라 두 곳의 커밋을 한 번에 묶는 원자성은 없다는 설명은 일반적인 설명이고, 위 문서는 이 점을 직접 다루지 않는다.
