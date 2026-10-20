---
slug: "cch-03"
topic: "db-cache"
tier: BASIC
difficulty: 1
title: "Redis 키에 만료 시간을 거는 방법과, 만료된 키가 실제로 지워지는 방식은 어떻게 되나요?"
keywords: ["EXPIRE·SET EX로 TTL 설정", "SET으로 덮어쓰면 TTL 제거", "접근 시 지연 삭제", "주기적 무작위 표본 삭제", "복제본은 마스터의 DEL을 따름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://redis.io/docs/latest/commands/expire/", "https://redis.io/docs/latest/commands/set/"]
concepts: [redis, cache]
importance: 2
links: [{to: "cch-04", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`EXPIRE`나 `SET 키 값 EX 초`로 키에 TTL을 걸면 시간이 지난 뒤 키가 자동으로 지워지고, 남은 시간은 `TTL`로 확인합니다. 주의할 점은 `SET`처럼 값을 통째로 덮어쓰면 TTL이 사라지고, `INCR`나 `LPUSH`처럼 값을 바꾸기만 하는 명령은 TTL을 그대로 둔다는 것입니다. 삭제는 두 방식으로 이뤄집니다. 만료된 키에 클라이언트가 접근했을 때 지우는 수동 방식과, 접근이 없어도 Redis가 주기적으로 만료 시간이 있는 키 중 일부를 무작위로 골라 지우는 능동 방식입니다. 복제 환경에서는 마스터가 만료를 판단해 DEL을 복제본과 AOF에 전달합니다.

```
SET session:1 v EX 100
TTL session:1              # 100
SET session:1 v2           # TTL 제거
TTL session:1              # -1 (만료 없음)
```

(공식 문서) EXPIRE 문서는 타임아웃이 `DEL`, `SET` 같은 키를 지우거나 덮어쓰는 명령으로만 지워지고 `INCR`, `LPUSH`, `HSET`처럼 값을 바꾸기만 하는 명령은 건드리지 않으며, 0 이하 타임아웃은 키를 바로 삭제한다고 한다. 부록 "How Redis expires keys"는 접근 시 만료를 확인하는 passive 방식과 주기적으로 만료 시간이 있는 키 일부를 무작위로 시험해 지우는 active 방식을 설명하고, 만료가 일어나면 AOF와 복제본에 DEL이 합성되어 전달되며 복제본은 독자적으로 만료시키지 않고 마스터의 DEL을 기다린다고 한다. `SET`의 EX·PX 옵션과, 성공한 `SET`이 이전 TTL을 버린다는 설명은 SET 문서에 있다.
(실험 확인) Redis 7.4.11에서 `SET k v EX 100` 뒤 `TTL`은 100, 다시 `SET`하면 -1이었다. TTL이 100인 키에 `INCR`을 해도 TTL은 100으로 유지됐다. `PX 300`으로 건 키는 0.6초 뒤 `GET`이 비어 있었고 `TTL`은 -2(키 없음)였다. `EXPIRE k 0`은 1을 돌려주고 키를 지웠다. `EXPIRE 50 GT`는 현재 TTL(100)보다 짧아 0, `200 GT`는 1로 적용됐다(GT·LT 옵션은 7.0.0부터).
