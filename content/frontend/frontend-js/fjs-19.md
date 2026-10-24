---
slug: "fjs-19"
topic: "frontend-js"
tier: TRICKY
difficulty: 3
title: "`async` 함수의 `try` 블록에서 `return promise` 와 `return await promise` 는 무엇이 다른가요?"
keywords: ["return promise 는 try 밖에서 거부 처리", "catch 가 거부를 잡지 못함", "return await 는 try 안에서 대기", "await 가 거부를 예외로 바꿈", "호출자에게 거부 전달"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-event-loop]
importance: 1
links: [{to: "fjs-14", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`return promise`는 프로미스를 그대로 반환하면서 함수 본문이 끝나는 것이라서, 그 프로미스가 나중에 거부돼도 이미 `try` 블록을 벗어난 뒤입니다. 그래서 함수 안의 `catch`는 동작하지 않고 거부가 그대로 호출자에게 전달됩니다. 반대로 `return await promise`는 `try` 안에서 기다리다가 거부되면 그 자리에서 예외가 던져지므로 `catch`가 잡을 수 있고, `finally`도 완료를 기다린 뒤 실행됩니다. 오류를 함수 안에서 처리하거나 정리 작업 순서를 맞춰야 한다면 `return await`를 써야 합니다.

```js
async function a() { try { return Promise.reject(new Error('r')); } catch (e) { return 'caught inside'; } }
async function b() { try { return await Promise.reject(new Error('r')); } catch (e) { return 'caught inside'; } }
a().then(console.log, e => console.log('a: rejected to caller:', e.message));
b().then(console.log);
// caught inside                  (b 의 catch 가 처리)
// a: rejected to caller: r      (a 의 catch 는 실행되지 않음)
```

(공식 문서) ECMA-262 27.10.5.3 Await는 거부된 프로미스에 대해 중단된 실행 컨텍스트를 throw 완료(ThrowCompletion(reason))로 재개한다고 적는다. 따라서 `await` 식이 `try` 안에 있으면 거부가 그 블록 안의 예외가 되어 `catch`로 처리된다. ReturnStatement 평가(14.10.1)의 암묵적 Await는 GetGeneratorKind가 async일 때만이고, 그것은 async 제너레이터에서만 해당하므로 일반 async 함수의 `return`은 값을 기다리지 않는다. AsyncBlockStart는 본문이 return 완료로 끝나면 async 함수의 프로미스를 그 반환 값으로 resolve하고, throw 완료로 끝나면 reject한다고 적는다. 반환 값이 프로미스면 resolve 함수가 이를 따라가므로, `return promise`에서는 함수 본문이 끝난 뒤에 그 프로미스의 결과가 전달된다.
(실험 확인) Node.js v24.16.0에서 위 블록의 출력은 `caught inside`가 먼저, `a: rejected to caller: r`가 나중이었다(두 줄의 순서 자체는 요점이 아니다). `finally`가 있는 변형(`try { return promise } finally { log }`와 `try { return await promise } finally { log }`, 프로미스는 30ms 뒤 이행)에서는 전자의 `finally`가 곧바로, 후자의 `finally`가 30ms 뒤에 실행됐다.
