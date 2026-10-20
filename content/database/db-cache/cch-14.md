---
slug: "cch-14"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "Spring Data Redis의 `RedisCacheManager`를 기본 설정으로 쓰면 어떤 점을 조심해야 하나요?"
keywords: ["기본 TTL 없음", "entryTtl로 만료 설정", "기본 JDK 직렬화", "캐시 이름 접두사", "clear는 KEYS 기본", "Redis는 TTI 미지원"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html"]
---
**모범 답변 (30~60초)**
기본 `RedisCacheConfiguration`은 만료 시간이 없어서 `entryTtl`을 주지 않으면 항목이 영원히 남습니다. 값 직렬화는 기본이 JDK 직렬화라 객체가 `Serializable`이어야 하고 사람이 읽기도 어려워서 보통 다른 직렬화기로 바꿉니다. 키에는 기본적으로 캐시 이름과 콜론 두 개가 접두사로 붙고, null 값도 기본으로 캐시합니다. 캐시를 비우는 `clear`는 기본이 `KEYS`로 키를 찾아 지우는 방식이라 키가 많으면 성능 문제가 될 수 있어 배치 전략을 `SCAN`으로 바꿀 수 있습니다. TTL은 쓰기 때만 갱신되며 Redis 자체는 읽을 때 만료가 연장되는 TTI를 지원하지 않습니다.

```java
RedisCacheConfiguration cfg = RedisCacheConfiguration.defaultCacheConfig()
    .entryTtl(Duration.ofMinutes(5));

RedisCacheManager cm = RedisCacheManager
    .builder(RedisCacheWriter.nonLockingRedisCacheWriter(cf, BatchStrategies.scan(1000)))
    .cacheDefaults(cfg)
    .build();
```

(공식 문서) Redis Cache 페이지의 기본값 표는 캐시 라이터가 락 없음과 `KEYS` 배치 전략이고, 키 만료 없음, null 캐시 예, 키 접두사 예(캐시 이름), 키 직렬화기 `StringRedisSerializer`, 값 직렬화기 `JdkSerializationRedisSerializer`라고 한다. 키에는 캐시 이름과 `::`가 붙고, `clear`는 기본이 `KEYS`와 `DEL`이며 `KEYS`는 큰 키 공간에서 문제가 될 수 있어 `BatchStrategies.scan`을 쓸 수 있다고 한다. 고정 `Duration` 또는 `TtlFunction`(3.2.0 도입)으로 TTL을 주고, Redis 자체는 진정한 TTI를 지원하지 않으며 Spring Data Redis의 옵트인 설정으로 비슷한 동작을 낼 수 있다고 한다.
(실험 확인) Spring Data Redis 4.1.0, Spring Framework 7.0.9(`spring-context-support`는 7.0.8), Lettuce 7.5.2, Redis 7.4.11에서 기본 `RedisCacheManager.create`로 `put`하자 키가 `cache:books::1`이었고 `TTL`은 -1, 값은 바이트 `ac ed`(자바 직렬화 시그니처)로 시작했다. `Serializable`이 아닌 객체를 넣자 `IllegalStateException: Cannot serialize value of type ... without a serializer`가 났다. `entryTtl(60초)`를 주자 `TTL`이 60이었다. `MONITOR`로 본 기본 `clear()`는 `KEYS cache:books::*` 뒤 `UNLINK`를 보냈고(문서의 `DEL`과 달리 `UNLINK`), `BatchStrategies.scan(100)`을 쓰면 `SCAN`이 호출됐다.
