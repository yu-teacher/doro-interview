---
slug: "fjs-14"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "`async`/`await` 는 어떻게 동작하나요?"
keywords: ["async 함수는 항상 프로미스를 반환", "첫 await 까지 동기 실행", "await 는 마이크로태스크로 재개", "거부는 await 지점의 예외", "독립 작업은 Promise.all"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-event-loop]
importance: 3
links: [{to: "fjs-12", kind: PREREQ}, {to: "fjs-15", kind: FOLLOWUP}, {to: "fjs-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`async` 함수는 항상 프로미스를 돌려주고, 본문은 첫 `await`를 만날 때까지 동기적으로 실행됩니다. `await`는 값을 프로미스로 바꿔서 이행·거부 처리기를 건 것과 같아서, 함수는 거기서 멈추고 호출자에게 제어를 넘기며 프로미스가 확정되면 마이크로태스크로 이어서 실행됩니다. 이행이면 값이 `await` 식의 결과가 되고, 거부면 그 자리에서 예외가 던져져 `try/catch`로 잡을 수 있습니다. 주의할 점은 `await`를 연달아 쓰면 순차 실행이라 독립 작업은 `Promise.all`로 묶어야 하고, `forEach`에 넘긴 `async` 콜백은 기다려 주지 않는다는 것입니다.

```js
async function f() { throw new Error('in async'); }
f() instanceof Promise;            // true  (throw 도 거부된 프로미스로 바뀜)
let out = [];
[1, 2, 3].forEach(async n => { await sleep(5); out.push(n); });
out.length;                        // 0  (forEach 는 기다리지 않음)
```

(공식 문서) ECMA-262 15.8.4 EvaluateAsyncFunctionBody는 새 PromiseCapability를 만들고 본문을 AsyncFunctionStart로 시작한 뒤 그 프로미스를 돌려준다고 적는다. AsyncBlockStart는 본문을 곧바로 평가하며, 정상 종료·return이면 프로미스의 resolve를, throw이면 reject를 호출한다. 27.10.5.3 Await는 값에 PromiseResolve를 적용한 뒤 PerformPromiseThen으로 이행·거부 처리기를 걸고, 각 처리기가 중단된 실행 컨텍스트를 이행 값 또는 throw 완료로 재개한다. 프로미스 반응 잡은 HostEnqueuePromiseJob(9.5.5)으로 예약되고, 잡은 예약된 순서대로 실행되어야 한다. 23.1.3.15 `Array.prototype.forEach`는 callback 호출 결과를 쓰지 않고 `undefined`를 돌려주므로 `async` 콜백이 돌려주는 프로미스를 기다리지 않는다.
(실험 확인) Node.js v24.16.0에서 위 블록이 주석대로 나왔다. `async` 함수 본문의 `console.log`는 호출한 줄에서 곧바로 실행됐고, `await 0` 뒤의 코드는 이미 예약된 `then` 콜백보다 늦게 실행됐다(`['then', 'after await 0']`). 50ms 대기를 `await` 두 번(순차)으로 하면 약 102ms, `Promise.all`로 하면 약 52ms였다(타이머 정밀도에 따라 달라질 수 있다).
