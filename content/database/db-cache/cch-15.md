---
slug: "cch-15"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "캐시와 DB의 데이터가 어긋나는 경우는 언제이고, Spring Cache에서는 어떻게 줄이나요?"
keywords: ["미스면 로드해 저장", "수정 시 CachePut 또는 CacheEvict", "성공 후 evict가 기본", "beforeInvocation", "동시 갱신 시 오래된 값 가능"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/integration/cache/strategies.html", "https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html", "https://redis.io/docs/latest/develop/get-started/faq/"]
---
**모범 답변 (30~60초)**
Spring 캐시 추상화는 조회할 때 캐시에서 먼저 찾고 없으면 메서드를 실행해 결과를 넣는 방식이라, 데이터를 바꾸는 쪽에서 캐시를 따로 갱신하지 않으면 캐시가 오래된 값을 계속 돌려줍니다. 그래서 수정 메서드에 `@CachePut`으로 새 값을 넣거나 `@CacheEvict`로 항목을 지웁니다. `@CacheEvict`는 기본적으로 메서드가 성공한 뒤에 실행되므로 예외가 나면 캐시는 그대로 남고, `beforeInvocation = true`면 결과와 상관없이 먼저 지웁니다. 문서는 추상화가 아무것도 잠그지 않아 여러 스레드가 동시에 갱신하거나 지우면 오래된 값을 쓸 수 있다고 하므로, 일관성이 중요하면 공급자의 기능을 확인해야 합니다.

```java
@Cacheable(cacheNames = "book", key = "#id")
Book find(long id) {...}

@CachePut(cacheNames = "book", key = "#id")        // 새 값으로 갱신
Book update(long id, ...) {...}

@CacheEvict(cacheNames = "book", key = "#id", beforeInvocation = true)  // 먼저 삭제
void delete(long id) {...}
```

(공식 문서) Understanding the Cache Abstraction 페이지는 캐시 항목이 프로그램적 캐시 상호작용의 get-if-not-found-then-proceed-and-put 블록과 같으며 락이 적용되지 않고 여러 스레드가 같은 항목을 동시에 로드할 수 있고, 갱신·제거도 마찬가지로 동시에 하면 오래된 데이터를 쓸 수 있다고 한다. 다중 노드에서 데이터가 바뀌면 다른 전파 메커니즘이 필요할 수 있다고도 한다. 어노테이션 페이지는 `@CachePut`이 메서드를 항상 실행하고, `@CacheEvict`는 기본적으로 메서드가 성공적으로 끝난 뒤(예외 시 제거 안 함) 제거하며 `beforeInvocation`으로 항상 먼저 제거할 수 있다고 한다. Redis FAQ는 Redis 데이터를 DB와 함께 갱신하고 캐시 미스 때 채우지 않는 방식이 단순한 캐싱보다 고급 모델이라고 언급한다.
(실험 확인) Spring Framework 7.0.9(`ConcurrentMapCacheManager`)에서 `@CacheEvict(beforeInvocation = false)` 메서드가 예외를 던지면 캐시 항목이 그대로 남았고, `beforeInvocation = true`는 같은 예외에도 항목이 지워졌다. `@CachePut` 호출 뒤 캐시 값이 새 값이었다.
(보충) 이런 조회·갱신 패턴을 cache-aside, write-through, write-behind, read-through 같은 이름으로 부르는 것은 일반적인 관례이고 이 공식 문서들은 그 이름을 정의하지 않는다. Spring의 `@Cacheable` 동작이 흔히 cache-aside로 불린다는 설명과 TTL로 불일치 기간을 제한한다는 방법은 공식 출처가 아닌 일반 지식이다.
