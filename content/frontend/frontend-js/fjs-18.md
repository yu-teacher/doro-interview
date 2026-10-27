---
slug: "fjs-18"
topic: "frontend-js"
tier: TRICKY
difficulty: 3
title: "`async` 함수, `Promise.then`, `setTimeout` 이 섞인 코드의 출력 순서는 어떻게 결정되나요?"
keywords: ["동기 코드가 먼저", "async 본문은 첫 await 까지 동기", "await 이후와 then 은 마이크로태스크", "setTimeout 은 태스크라 마지막", "예약된 순서대로 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://html.spec.whatwg.org/multipage/webappapis.html", "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html"]
concepts: [js-event-loop]
importance: 2
links: [{to: "fjs-14", kind: PREREQ}, {to: "fjs-15", kind: PREREQ}]
---
**모범 답변 (30~60초)**
동기 코드가 모두 끝난 뒤에 마이크로태스크가 큐에 들어온 순서대로 실행되고, `setTimeout` 콜백은 그다음 태스크로 실행됩니다. 위 코드에서 `async` 함수의 본문은 첫 `await` 전까지 동기로 돌기 때문에 `a1 start`, `a2`가 바로 나오고 `p1`, `script end`가 이어집니다. `await a2()`는 이미 이행된 프로미스에 이어서 실행할 일을 마이크로태스크로 예약하고, 그다음 줄의 `.then(p2)`도 마이크로태스크라서 예약 순서대로 `a1 end`, `p2`가 나옵니다. 마지막이 `setTimeout`입니다.

```js
async function a1() { console.log('a1 start'); await a2(); console.log('a1 end'); }
async function a2() { console.log('a2'); }
console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
a1();
new Promise(r => { console.log('p1'); r(); }).then(() => console.log('p2'));
console.log('script end');
// script start, a1 start, a2, p1, script end, a1 end, p2, setTimeout
```

(공식 문서) ECMA-262 15.8.4 EvaluateAsyncFunctionBody는 본문을 AsyncFunctionStart로 곧바로 시작해 프로미스를 돌려준다고 하고, 27.10.5.3 Await는 값에 PromiseResolve를 적용한 뒤 PerformPromiseThen으로 재개용 처리기를 건다고 한다. 이미 이행된 프로미스에 `then`을 걸면 즉시 잡이 예약된다(Promise Objects 절). 9.5.5는 잡이 예약된 순서대로 실행되어야 한다고 한다. HTML 표준 8.1.7.3은 태스크 하나를 실행한 뒤 microtask checkpoint를 수행한다고 하고, 8.1.6.6.4 HostEnqueuePromiseJob은 프로미스 잡을 microtask queue에 넣는다고 하며, 스크립트 실행이 끝나 자바스크립트 실행 컨텍스트 스택이 비면 clean up after running script 단계가 microtask checkpoint를 수행한다고 한다. `setTimeout` 콜백은 timer task source의 태스크로 큐잉된다(8.7 Timers). 그래서 스크립트가 끝나면 마이크로태스크가 먼저 비워지고 그다음 `setTimeout` 태스크가 선택된다.
(공식 문서) 프로미스를 `resolve` 값으로 넘기면 한 단계가 더 늘어난다. ECMA-262의 resolve 함수는 `then`을 가진 객체를 받으면 NewPromiseResolveThenableJob을 잡으로 예약하고, 그 잡이 `then`을 호출해서야 원래 프로미스가 확정된다.
(실험 확인) Node.js v24.16.0에서 위 블록의 출력이 주석과 같았다. 별도 실험에서 `Promise.resolve().then(a1).then(a2).then(a3).then(a4)`와 `new Promise(r => r(Promise.resolve())).then(b)`를 함께 실행하면 순서가 `a1 a2 a3 b a4`로, `b`가 두 단계 늦게 실행됐다.
