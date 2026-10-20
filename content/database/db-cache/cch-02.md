---
slug: "cch-02"
topic: "db-cache"
tier: BASIC
difficulty: 1
title: "Redis의 String, List, Hash, Set, Sorted Set은 각각 어떤 용도로 쓰나요?"
keywords: ["String 문자열과 카운터", "List 큐와 스택", "Hash 필드 단위 객체", "Set 중복 없는 집합", "Sorted Set 점수 순서"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/develop/data-types/", "https://redis.io/docs/latest/develop/data-types/compare-data-types/"]
---
**모범 답변 (30~60초)**
String은 텍스트나 바이너리 값 하나를 저장하고 카운터로도 씁니다. List는 문자열의 순서 있는 시퀀스로 양 끝에서 넣고 빼는 것이 효율적이라 큐나 스택에 맞습니다. Hash는 필드와 값 쌍을 모아 필드가 많지 않은 객체를 저장할 때 쓰고, Set은 중복 없는 문자열 집합으로 포함 여부 확인과 교집합, 합집합에 씁니다. Sorted Set은 원소마다 점수를 붙여 점수나 순위 범위로 조회할 수 있어 우선순위 큐나 점수 순으로 정렬된 컬렉션에 맞습니다. 용도가 일부 겹치기 때문에 문서도 고르는 기준을 엄격한 규칙이 아닌 경험칙이라고 하고, 필요한 연산이 무엇인지를 보고 선택합니다.

```
SET user:1:name kim            # string
LPUSH queue job1 job2          # list
HSET user:1 name kim age 20    # hash
SADD tags redis cache          # set
ZADD rank 90 alice 70 bob      # sorted set
ZRANGE rank 0 -1 WITHSCORES    # 점수 오름차순
```

(공식 문서) 자료형 개요와 "Compare data types" 페이지에 근거한다. 문자열은 비정형 텍스트·바이너리와 카운터에, 해시는 중첩이 없고 필드 수가 적은 객체에, 리스트는 큐·스택·로그에, 셋은 고유 항목 집합(포함 확인과 교집합·합집합·차집합)에, 정렬 셋은 점수가 붙은 고유 항목과 점수·순위 범위 조회(우선순위 큐 포함)에 적합하다고 소개한다. 문서는 이 제안을 엄격한 처방이 아닌 경험칙으로 보라고 한다.
(실험 확인) Redis 7.4.11에서 위 명령 뒤 `TYPE`이 각각 string, list, hash, set, zset을 돌려줬다. `ZRANGE rank 0 -1 WITHSCORES`는 점수 오름차순(bob 70, carol 80, alice 90)으로 나왔고, `ZREVRANGE`는 가장 높은 alice를 먼저 줬다. 문자열 키에 `LPOP`을 하면 `WRONGTYPE Operation against a key holding the wrong kind of value` 오류가 났다.
