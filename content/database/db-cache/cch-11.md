---
slug: "cch-11"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "`volatile-lru` 같은 volatile 계열 eviction 정책에서 주의할 점과, Redis의 LRU가 정확한 LRU가 아니라는 말의 뜻은 무엇인가요?"
keywords: ["volatile은 TTL 키만 대상", "TTL 없으면 noeviction처럼 동작", "캐시와 영구 데이터 혼용", "근사 LRU 무작위 표본", "maxmemory-samples"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/reference/eviction/"]
concepts: [redis, cache]
importance: 1
---
**모범 답변 (30~60초)**
volatile 계열 정책은 만료 시간이 설정된 키만 퇴출 후보로 보기 때문에, TTL이 걸린 키가 없으면 noeviction처럼 동작해서 메모리가 차면 쓰기 오류가 납니다. 문서는 이 정책들을 한 인스턴스에 캐시와 영구 키를 함께 둘 때 쓰는 용도로 보고, 가능하면 인스턴스를 나누라고 권합니다. TTL을 거는 것 자체도 메모리를 더 쓰기 때문에 allkeys-lru가 더 효율적입니다. Redis의 LRU는 정확한 LRU가 아니라 무작위로 뽑은 표본 중 가장 오래 쓰이지 않은 키를 지우는 근사 알고리즘이고, 표본 수는 `maxmemory-samples`로 조절합니다. 복제와 AOF 버퍼는 maxmemory 계산에 포함되지 않으므로 여유를 남깁니다.

```
maxmemory-policy volatile-lru
maxmemory-samples 5
```

(공식 문서) Key eviction 페이지에 근거한다. volatile 정책은 만료 키가 없으면 noeviction처럼 동작하고, `volatile-lru`·`volatile-lrm`·`volatile-random`은 주로 한 인스턴스를 캐시와 영구 키에 함께 쓸 때 유용하지만 가능하면 인스턴스를 나누는 것을 고려하라고 한다. 만료 시간을 설정하는 데 메모리가 들어 `allkeys-lru`가 더 메모리 효율적이라고 한다. LRU는 메모리를 더 쓰는 정확한 구현 대신 소수의 키를 무작위로 표본 추출하는 근사이고 3.0부터 후보 풀을 유지하며, `maxmemory-samples`를 10으로 올리면 정확한 LRU에 가까워지지만 CPU를 더 쓴다. 복제 버퍼와 AOF 버퍼는 퇴출 판단 메모리에 포함되지 않는다고 한다. 4.0부터 LFU 모드도 있다.
(실험 확인) Redis 7.4.11을 `--maxmemory 3mb`로 띄우고 `volatile-lru`에서 TTL 없는 1KB 키 6,000개를 채우자 약 1,900개를 넣은 뒤부터 `SET`이 OOM 오류를 냈고 `evicted_keys`는 0이었다. 같은 정책에서 모든 키에 `EX 1000`을 붙여 채우자 6,000개가 모두 성공했고 `evicted_keys`가 수천으로 늘었다(개수는 실행마다 조금 달랐다). TTL 없는 키 1,500개와 TTL 있는 키 3,000개를 섞어 넣으면 TTL 없는 키는 남고 TTL 있는 키만 퇴출됐다. `maxmemory-samples` 기본값은 5였다.
