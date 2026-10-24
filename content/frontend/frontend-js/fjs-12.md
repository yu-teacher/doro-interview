---
slug: "fjs-12"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "Promise 의 상태는 어떻게 바뀌고, `then` 체이닝에서 에러는 어떻게 전파되나요?"
keywords: ["pending·fulfilled·rejected", "한 번 확정되면 불변", "then 은 새 프로미스를 반환", "예외는 가장 가까운 catch 로", "finally 는 결과를 바꾸지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://nodejs.org/docs/latest/api/process.html"]
concepts: [js-event-loop]
importance: 3
links: [{to: "fjs-13", kind: FOLLOWUP}, {to: "fjs-14", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Promise는 대기(pending), 이행(fulfilled), 거부(rejected)의 세 상태를 가지고, 한 번 확정되면 이후의 `resolve`나 `reject` 호출은 무시됩니다. `then`은 항상 새 프로미스를 돌려줘서 체이닝이 되는데, 콜백이 값을 반환하면 다음 단계로 넘어가고 프로미스를 반환하면 그 결과를 기다려 이어집니다. 예외를 던지면 거부 상태가 되어 사이의 `then`들을 건너뛰고 가장 가까운 `catch`로 가며, `catch`가 값을 반환하면 체인은 다시 이행 상태로 돌아옵니다. `finally`는 보통 결과를 바꾸지 않고 정리용으로 실행되지만 그 안에서 예외를 던지면 그 거부로 바뀌고, 처리되지 않은 거부는 Node.js에서 기본적으로 프로세스를 오류로 종료시킵니다.

```js
new Promise(res => { console.log('executor sync'); res(1); })
  .then(v => v + 1)
  .then(v => { throw new Error('boom'); })
  .then(() => console.log('skipped'))
  .catch(e => 'recovered')
  .finally(() => console.log('finally'))
  .then(v => console.log(v));   // executor sync, finally, recovered
```

(공식 문서) ECMA-262 Promise Objects 절은 Promise가 fulfilled, rejected, pending 중 정확히 한 상태이고, 이미 resolved 된 프로미스에 resolve나 reject를 시도해도 효과가 없다고 적는다. 27.5.3.1 `Promise(executor)`는 executor를 생성 시점에 `Call`로 곧바로 호출한다. 27.5.5.4 `Promise.prototype.then`은 새 PromiseCapability를 만들어 PerformPromiseThen에 넘기므로 새 프로미스를 돌려주며, `finally`는 onFinally를 호출한 뒤 값을 돌려주는 thunk(이행일 때)나 사유를 다시 던지는 thrower(거부일 때)를 이어 붙여 원래 결과를 이어 가지만, onFinally 호출에 `?`가 붙어 있어 예외를 던지면 그 예외가 우선한다. 27.5.5.1 `catch`는 `then(undefined, onRejected)`를 호출하는 것이고, 27.5.2.1 NewPromiseReactionJob은 처리기가 없으면 이행 값은 그대로 통과시키고 거부 사유는 다시 throw로 넘긴다(그래서 사이의 `then`을 건너뛴다). 27.5.1.3 CreateResolvingFunctions의 resolve 함수는 `then`을 가진 객체를 받으면 NewPromiseResolveThenableJob을 예약해 그 프로미스의 결과를 따라간다.
(공식 문서) Node.js process 문서는 거부된 프로미스에 한 턴 안에 처리기가 붙지 않으면 `'unhandledRejection'` 이벤트가 발생하고, 이벤트가 발생했는데 처리되지 않으면 잡히지 않은 예외로 올라간다고 설명한다.
(실험 확인) Node.js v24.16.0에서 위 블록의 출력 순서는 `executor sync`, `finally`, `recovered`였고 `skipped`는 찍히지 않았다. `Promise.resolve(1).then(2)`는 숫자 인자를 무시하고 값 1을 통과시켰고, `finally` 콜백이 예외를 던지면 체인이 그 오류로 거부됐으며 콜백이 값을 돌려줘도 원래 값 1이 유지됐고, `Promise.resolve(p) === p`였다. 처리기 없이 `Promise.reject(new Error(...))`만 실행한 스크립트는 종료 코드 1로 끝났고 이어서 예약한 타이머는 실행되지 않았다.
