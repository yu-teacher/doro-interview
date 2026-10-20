---
slug: "cch-04"
topic: "db-cache"
tier: BASIC
difficulty: 2
title: "Redis에 maxmemory를 설정하면 메모리가 가득 찼을 때 어떻게 되고, eviction 정책은 어떻게 고르나요?"
keywords: ["maxmemory 상한", "noeviction은 쓰기 오류", "allkeys-lru 기본 선택지", "volatile 정책은 TTL 키만", "evicted_keys로 점검"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/reference/eviction/"]
concepts: [redis, cache]
importance: 3
links: [{to: "cch-11", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
maxmemory는 캐시 데이터에 쓸 메모리 상한이고 0이면 제한이 없습니다. 상한을 넘으면 maxmemory-policy가 동작을 정합니다. noeviction은 키를 지우지 않고 새 데이터를 추가하는 명령에 오류를 돌려주며 읽기는 계속 됩니다. allkeys-lru는 모든 키 중 가장 오래 쓰이지 않은 키부터, allkeys-lfu는 가장 적게 쓰인 키부터 지우고, volatile 계열은 TTL이 있는 키만 대상으로 합니다. 접근이 일부 키에 몰리는 흔한 캐시라면 문서가 allkeys-lru를 좋은 기본 선택지로 권하고, 정책이 잘 맞는지는 `INFO`의 `keyspace_hits`, `keyspace_misses`, `evicted_keys`를 보고 점검합니다.

```
maxmemory 100mb
maxmemory-policy allkeys-lru
```

(공식 문서) Key eviction 페이지에 근거한다. maxmemory 0은 무제한(64비트 기본)이고, 한도를 넘는 데이터를 추가하는 명령이 실행될 때 정책에 따라 키를 지운다. noeviction은 쓰기 명령에 오류를 내고 읽기는 정상이며, 다른 정책을 선호할 이유가 없다면 allkeys-lru가 좋은 기본값이라고 권한다. 이 페이지는 최신(latest) 문서라서 Redis 8.6부터 추가된 `allkeys-lrm`·`volatile-lrm`도 나열한다.
(실험 확인) 7.4.11 컨테이너를 `--maxmemory 3mb --maxmemory-policy noeviction`으로 띄우고 1KB 값 6,000개를 차례로 넣자 약 1,900개를 넣은 뒤부터 `SET`이 `OOM command not allowed when used memory > 'maxmemory'.` 오류를 냈고(`cmdstat_set`의 `rejected_calls`가 0이 아니었다), 이미 있는 키의 `GET`은 정상이었다. 정책을 `allkeys-lru`로 바꾸자 같은 쓰기 6,000개가 모두 성공했고 `evicted_keys`가 수천으로 늘었다(정확한 개수는 실행마다 조금 달랐다). 설정 없이 띄운 7.4.11의 기본은 `maxmemory 0`, `maxmemory-policy noeviction`이었고, `CONFIG SET maxmemory-policy allkeys-lrm`은 7.4.11에서 허용 목록에 없다며 거부됐다.
