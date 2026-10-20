---
slug: "cch-06"
topic: "db-cache"
tier: BASIC
difficulty: 1
title: "Spring의 `@Cacheable`, `@CachePut`, `@CacheEvict`는 각각 무엇을 하고, 캐시를 쓰려면 무엇을 설정해야 하나요?"
keywords: ["@Cacheable 히트 시 메서드 생략", "@CachePut 항상 실행 후 갱신", "@CacheEvict 항목 제거", "@EnableCaching", "CacheManager 저장소"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/integration/cache.html", "https://docs.spring.io/spring-framework/reference/integration/cache/strategies.html", "https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html", "https://docs.spring.io/spring-framework/reference/integration/cache/store-configuration.html", "https://docs.spring.io/spring-data/redis/reference/redis/redis-cache.html"]
---
**모범 답변 (30~60초)**
`@Cacheable`은 같은 인자로 호출한 결과가 캐시에 있으면 메서드를 실행하지 않고 그 값을 돌려주고, 없으면 실행한 뒤 결과를 저장합니다. `@CachePut`은 메서드를 항상 실행하고 그 결과로 캐시를 갱신하며, `@CacheEvict`는 키에 해당하는 항목 하나나 `allEntries`로 전체를 지웁니다. 어노테이션만 붙인다고 동작하지는 않고 설정 클래스에 `@EnableCaching`을 켜야 합니다. 또 스프링의 캐시는 저장소가 아니라 추상화라서 `CacheManager` 빈으로 ConcurrentMap, Caffeine, Redis 같은 실제 구현을 골라 등록해야 합니다. 같은 입력에 항상 같은 결과를 내는 메서드에 적합합니다.

```java
@Configuration
@EnableCaching
class CacheConfig {
    @Bean CacheManager cacheManager() { return new ConcurrentMapCacheManager(); }
}

@Cacheable("books")  public Book find(long id) {...}
@CachePut(cacheNames = "books", key = "#id") public Book update(long id, ...) {...}
@CacheEvict(cacheNames = "books", key = "#id") public void delete(long id) {...}
```

(공식 문서) Cache Abstraction 문서군(Understanding the Cache Abstraction, Declarative Annotation-based Caching, Configuring the Cache Storage)에 근거한다. `@Cacheable`은 캐시가 있으면 메서드 호출을 생략하고, `@CachePut`은 메서드를 항상 호출하며 결과로 캐시를 갱신하고, `@CacheEvict`는 `allEntries`와 `beforeInvocation` 속성을 가진다고 한다. 어노테이션은 `@EnableCaching`으로 선언적으로 켜야 하고, 추상화는 캐시 구현이 아니라 `Cache`와 `CacheManager` 인터페이스이며 실제 저장소를 따로 필요로 하고, 구현으로 ConcurrentMap, Gemfire, Caffeine, JSR-107 캐시를 든다. Redis는 Spring Data Redis의 Redis Cache 문서가 `RedisCacheManager`로 제공한다고 한다. 이 접근은 같은 입력에 항상 같은 결과를 내는 메서드에만 맞는다고 한다.
(실험 확인) Spring Framework 7.0.9(JDK 25, `ConcurrentMapCacheManager`)에서 `@Cacheable` 메서드를 프록시 경유로 같은 인자로 두 번 호출하자 실제 실행은 1번이었다. `@CachePut` 메서드 호출 뒤 캐시 값이 새 제목으로 바뀌어 있었다. 빈 클래스 이름은 `CacheLab$BookService$$SpringCGLIB$$0`로, CGLIB 프록시였다.
