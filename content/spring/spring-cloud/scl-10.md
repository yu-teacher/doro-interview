---
slug: "scl-10"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "Gateway의 `RequestRateLimiter`는 어떻게 동작하고, `KeyResolver`와 `replenishRate`, `burstCapacity`는 무엇인가요?"
keywords: ["KeyResolver로 제한 대상 결정", "토큰 버킷", "replenishRate와 burstCapacity", "Redis 기반 구현", "초과 시 429"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/gatewayfilter-factories/requestratelimiter-factory.html"]
concepts: [api-gateway, redis]
importance: 2
links: [{to: "scl-03", kind: PREREQ}, {to: "web-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
`RequestRateLimiter` 필터는 `RateLimiter` 구현에게 현재 요청을 통과시켜도 되는지 묻고, 안 되면 기본으로 429 Too Many Requests를 돌려줍니다. 누구를 기준으로 셀지는 `KeyResolver` 빈이 정하며 기본은 인증된 `Principal`의 이름이고, 키를 못 찾으면 기본적으로 요청을 거부합니다. Redis 구현은 토큰 버킷 알고리즘이라 `replenishRate`는 초당 채워지는 토큰 수, `burstCapacity`는 버킷이 담는 최대 토큰 수이고, 둘을 같게 두면 일정한 속도가 됩니다. 이 필터는 단축 표기로 설정할 수 없어서 `args`로 풀어 써야 합니다.

(공식 문서) 문서는 필터가 `RateLimiter` 구현으로 현재 요청의 진행 여부를 판단하고 거부하면 기본 429를 반환하며 상태 코드는 설정할 수 있다고 쓴다. `keyResolver`는 `KeyResolver` 인터페이스(`Mono<String> resolve(ServerWebExchange)`)를 구현한 빈이고 SpEL로 이름을 참조한다. 기본 구현은 `Principal.getName()`을 쓰는 `PrincipalNameKeyResolver`이며, 키를 못 찾으면 요청을 거부하는 것이 기본이고 `deny-empty-key`로 바꿀 수 있다. 이 필터는 단축 표기로 설정할 수 없다고 명시한다.
(공식 문서) Redis 구현은 Stripe의 작업에 기반하고 `spring-boot-starter-data-redis-reactive`가 필요하며 토큰 버킷 알고리즘을 쓴다. `replenishRate`는 버려지는 요청 없이 허용할 초당 요청 수(버킷이 채워지는 속도), `burstCapacity`는 1초 동안 허용되는 최대 요청 수(버킷이 담는 토큰 수), `requestedTokens`는 요청 하나가 가져가는 토큰 수로 기본 1이다. 두 값을 같게 하면 꾸준한 속도이고, `burstCapacity`를 더 높게 하면 일시적 버스트를 허용하되 연속 버스트는 429가 된다고 설명한다. Bucket4j 구현도 있다.
(보충) Redis를 쓰는 이유는 여러 게이트웨이 인스턴스가 버킷 상태를 공유해 인스턴스 수와 무관하게 한도를 지키기 위해서라고 보통 설명한다. 읽은 RequestRateLimiter 문서에는 이 이유를 직접 설명하는 문장이 없었고(Bucket4j 절에 분산 저장소 옵션이 필요하다는 문장만 있다), 실제 Redis로 동작을 실험하지도 않았다.
