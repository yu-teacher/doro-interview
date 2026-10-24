---
slug: "fjs-06"
topic: "frontend-js"
tier: BASIC
difficulty: 1
title: "옵셔널 체이닝(`?.`)과 널 병합 연산자(`??`)는 무엇이고, `||` 와 어떻게 다른가요?"
keywords: ["?. 는 null·undefined 이면 undefined 로 단락", "?? 는 null·undefined 일 때만 오른쪽 값", "|| 는 falsy 전체에 오른쪽 값", "0·빈 문자열 보존", "?? 와 || 혼용 시 괄호"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [null-handling]
importance: 2
---
**모범 답변 (30~60초)**
`?.`는 왼쪽 값이 `null`이나 `undefined`면 뒤쪽 접근과 호출을 건너뛰고 `undefined`를 돌려주는 연산자라서, `user?.profile?.name`처럼 중간에 비어 있을 수 있는 경로를 안전하게 읽습니다. `??`는 왼쪽이 `null`이나 `undefined`일 때만 오른쪽 값을 쓰고, `||`는 `0`, 빈 문자열, `false`, `NaN` 같은 falsy 값 전체에서 오른쪽을 씁니다. 그래서 개수 `0`이나 빈 문자열을 유효한 값으로 두고 기본값을 줄 때는 `??`가 맞습니다. 또 `??`는 괄호 없이 `||`, `&&`와 섞어 쓰면 문법 오류입니다.

```js
const u = { n: 0, s: '', profile: null };
u.profile?.name   // undefined (오류 아님)
u.n || 10         // 10
u.n ?? 10         // 0
u.s ?? 'd'        // ''
null || undefined ?? 1  // SyntaxError
```

(공식 문서) ECMA-262 OptionalExpression 평가 규칙은 기반 값이 `undefined` 또는 `null`이면 `undefined`를 반환하고 그렇지 않으면 뒤 체인을 평가한다고 적는다. 13.13절의 CoalesceExpression 규칙은 왼쪽 값이 `undefined`도 `null`도 아니면 그 값을 반환하고 아니면 오른쪽을 평가한다고 하며, `||` 규칙은 왼쪽을 ToBoolean으로 바꿔 true면 왼쪽을 반환한다. 7.1.2 ToBoolean은 `undefined`, `null`, `+0`, `-0`, `NaN`, `0n`, 빈 문자열을 false로 정한다. 문법상 ShortCircuitExpression은 LogicalORExpression 또는 CoalesceExpression 중 하나이므로 둘을 괄호 없이 섞는 형태는 존재하지 않는다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔다. 추가로 `u.cb?.()`는 `undefined`, `(5)?.toFixed(1)`은 `'5.0'`, 함수가 아닌 값에 `?.()`를 쓰면 TypeError였고, `v.x ||= 5; v.y ??= 7`은 논리 대입으로 동작했다.
