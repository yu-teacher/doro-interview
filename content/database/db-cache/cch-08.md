---
slug: "cch-08"
topic: "db-cache"
tier: DEEP
difficulty: 2
title: "Redis의 `MULTI`/`EXEC` 트랜잭션은 무엇을 보장하고, 중간에 명령이 실패하면 롤백되나요?"
keywords: ["MULTI EXEC 순차 실행", "다른 클라이언트 명령이 끼어들지 않음", "롤백 미지원", "큐잉 중 오류는 EXECABORT", "실행 중 오류는 나머지 계속"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://redis.io/docs/latest/develop/using-commands/transactions/"]
concepts: [redis, acid]
importance: 2
links: [{to: "cch-09", kind: FOLLOWUP}, {to: "dbt-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
`MULTI` 이후의 명령은 바로 실행되지 않고 큐에 쌓였다가 `EXEC`에서 순서대로 한꺼번에 실행되며, 그 사이에 다른 클라이언트의 요청이 끼어들지 않아 하나의 격리된 작업처럼 동작합니다. 하지만 RDBMS 같은 롤백은 없습니다. 명령 이름이나 인자가 틀려 큐에 넣을 때 난 오류는 `EXEC`가 `EXECABORT`로 트랜잭션 전체를 거부하지만, 큐에 잘 들어간 명령이 실행 중에 실패하면, 예컨대 문자열 키에 리스트 명령을 쓰면 그 명령만 오류가 나고 나머지는 그대로 실행되어 앞서 바뀐 값도 남습니다. 문서는 롤백을 지원하지 않는 이유로 단순함과 성능을 듭니다.

```
MULTI
SET a abc
INCR a          # 실행 시점에 오류
SET b 2
EXEC            # SET a 는 OK, INCR a 는 오류, SET b 는 OK
```

(공식 문서) Transactions 페이지에 근거한다. 트랜잭션의 명령은 직렬화되어 순차 실행되고 실행 도중 다른 클라이언트의 요청이 처리되지 않으며, `EXEC` 전에 연결이 끊기면 아무것도 실행되지 않는다. 큐잉 단계 오류(문법, 메모리 부족 등)는 2.6.5부터 `EXEC`가 트랜잭션을 거부하고, `EXEC` 이후의 오류는 특별히 처리하지 않아 다른 명령은 그대로 실행된다. 롤백을 지원하지 않는 이유는 단순함과 성능에 큰 영향을 주기 때문이라고 설명한다. `DISCARD`는 큐를 비우고 트랜잭션을 끝낸다.
(실험 확인) 큐잉 중 오류로 EXEC 가 거부될 때의 오류 이름 `EXECABORT` 는 실험에서 받은 응답 이름이며, 참고한 문서 페이지에는 이 이름이 나오지 않는다. Redis 7.4.11에서 위 순서대로 하자 `EXEC` 결과가 `OK`, `ERR value is not an integer or out of range`, `OK`였고 `a`는 `abc`, `b`는 `2`로 남았다(롤백 없음). 큐잉 단계에서 `INCR c a b c`처럼 인자 수가 틀린 명령을 넣자 즉시 `wrong number of arguments` 오류가 났고, `EXEC`는 `EXECABORT Transaction discarded because of previous errors.`를 돌려줬으며 앞서 큐에 넣은 `SET`도 실행되지 않았다(`GET`이 비어 있었다).
