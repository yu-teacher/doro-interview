---
slug: "cch-16"
topic: "db-cache"
tier: DEEP
difficulty: 3
title: "`@Cacheable(sync = true)`를 붙이면 캐시 미스가 동시에 나도 항상 한 번만 로드되나요?"
keywords: ["기본은 락 없음", "sync는 공급자가 지원해야 함", "ConcurrentMap은 한 번만 로드", "RedisCacheManager 기본은 락 없음", "lockingRedisCacheWriter", "캐시 단위 락"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html", "https://docs.spring.io/spring-framework/reference/integration/cache/strategies.html", "https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html"]
concepts: [cache, race-condition]
importance: 1
---
**모범 답변 (30~60초)**
항상 그렇지는 않습니다. 기본 캐시 추상화는 아무것도 잠그지 않아서 같은 인자의 호출이 동시에 미스를 만나면 값을 여러 번 계산합니다. `sync = true`는 캐시 공급자에게 항목을 잠근 채 계산하도록 요청하는 선택 기능이라 공급자가 지원해야 하고, 문서는 핵심 프레임워크가 제공하는 CacheManager들, 예컨대 ConcurrentMap 기반은 지원한다고 말합니다. Spring Data Redis의 `RedisCacheManager`는 기본이 락 없는 라이터라 처리량은 좋지만 여러 명령이 겹칠 수 있고, 락이 필요하면 `lockingRedisCacheWriter`를 직접 골라야 합니다. 이 락은 항목별이 아니라 캐시 단위로 걸리고 요청이 더 늘어나는 비용이 있습니다.

```java
@Cacheable(cacheNames = "cache:sync", sync = true)
String slow(long id) {...}

RedisCacheManager cm = RedisCacheManager
    .builder(RedisCacheWriter.lockingRedisCacheWriter(connectionFactory))
    .build();
```

(공식 문서) 어노테이션 페이지는 기본적으로 캐시 추상화가 락을 걸지 않아 같은 값이 여러 번 계산될 수 있고, `sync` 속성이 공급자에게 값을 계산하는 동안 캐시 항목을 잠그도록 요청하는 선택 기능이며 핵심 프레임워크가 제공하는 모든 `CacheManager`가 지원한다고 한다. Redis Cache 페이지는 `RedisCacheManager`가 기본으로 락 없는 `RedisCacheWriter`를 쓰고, 락이 없으면 `putIfAbsent`와 `clean`이 겹쳐 비원자적일 수 있으며, 락 버전은 명시적 락 키를 두어 겹침을 막되 요청이 늘고 락은 캐시 단위로 적용된다고 한다. 다중 프로세스 환경 처리는 캐시 구현의 몫이라고 Spring 문서가 밝힌다.
(실험 확인) 한 JVM에서 스레드 8개가 같은 키로 동시에 미스를 낸 결과(Spring Framework 7.0.9, Spring Data Redis 4.1.0, Redis 7.4.11): `ConcurrentMapCacheManager`는 `sync` 없이 로드 8번, `sync = true`로 1번이었다. 기본 `RedisCacheManager.create`는 `sync = true`인데도 로드 8번(두 번 반복해 같았고), `lockingRedisCacheWriter`를 쓰자 1번이었다. 여러 JVM이 동시에 미스를 내는 경우는 실험하지 않았다.
(보충) 이런 현상을 흔히 캐시 스탬피드라고 부르며, 위 설명은 스프링 문서가 다루는 범위(`sync`와 락 라이터)까지만이다.
