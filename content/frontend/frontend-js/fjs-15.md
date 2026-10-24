---
slug: "fjs-15"
topic: "frontend-js"
tier: DEEP
difficulty: 3
title: "이벤트 루프는 어떻게 동작하나요? 마이크로태스크와 매크로태스크(태스크)는 무엇이 다른가요?"
keywords: ["태스크 하나 끝날 때마다 마이크로태스크 전부 실행", "마이크로태스크는 큐가 빌 때까지 전부 실행", "Promise then 은 마이크로태스크", "setTimeout 은 태스크", "마이크로태스크를 계속 넣으면 타이머 지연"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://html.spec.whatwg.org/multipage/webappapis.html", "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html"]
concepts: [js-event-loop]
importance: 3
links: [{to: "fjs-12", kind: PREREQ}, {to: "fjs-18", kind: FOLLOWUP}, {to: "osm-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
자바스크립트는 한 번에 한 가지 코드만 실행하고, 이벤트 루프가 큐에서 일감을 꺼내 실행합니다. 일감은 두 종류입니다. 타이머 콜백이나 이벤트 처리 같은 태스크는 루프가 한 번에 하나씩 꺼내고, Promise의 `then`이나 `queueMicrotask`가 넣는 마이크로태스크는 태스크 하나가 끝날 때마다 큐가 빌 때까지 전부 실행됩니다. 그래서 `setTimeout(f, 0)`보다 `then`이 먼저 실행되고, 마이크로태스크를 계속 새로 넣으면 타이머가 밀립니다. 브라우저에서 중첩된 타이머는 일정 단계 이후 최소 4ms로 늘어납니다.

```js
console.log('1');
setTimeout(() => console.log('4 timeout'), 0);
Promise.resolve().then(() => console.log('3 then'));
console.log('2');
// 출력: 1, 2, 3 then, 4 timeout
```

(공식 문서) ECMA-262 9.5는 Job을 다른 ECMAScript 계산이 진행 중이지 않을 때 계산을 시작하는 단위로 설명하고 호스트가 에이전트 안에서 예약한다고 한다. HTML Living Standard 8.1.7.3 Processing model은 이벤트 루프가 큐에서 가장 오래된 태스크를 골라 실행한 뒤 microtask checkpoint를 수행한다고 적고, 마이크로태스크 큐는 태스크 큐가 아니라고 못박는다. microtask checkpoint는 마이크로태스크 큐가 빌 때까지 하나씩 꺼내 실행하며, 실행 중 다시 불러도 재진입하지 않는다. 8.8 Microtask queuing은 `queueMicrotask(callback)`을 정의한다.
(공식 문서) HTML 표준 8.7 Timers의 timer initialization steps는 nestingLevel이 5보다 크고 timeout이 4보다 작으면 timeout을 4로 올린다고 적는다. ECMA-262 9.5.5 HostEnqueuePromiseJob은 프로미스 잡을 호스트가 예약하되 호출된 순서대로 실행해야 한다고 하고, 9.5는 한 에이전트에서 한 시점에 하나의 Job만 평가되며 시작한 Job은 끝까지 실행된 뒤에 다른 Job이 시작된다고 한다. HTML 8.1.6.6.4 HostEnqueuePromiseJob은 프로미스 관련 작업을 microtask queue에 넣는다고 하고, 8.8은 마이크로태스크를 많이 예약하면 동기 코드를 많이 돌리는 것과 같이 렌더링 같은 브라우저의 다른 일을 막는다고 한다. 8.1.7.3은 어느 태스크 큐에서 태스크를 고를지는 구현이 정한다고 적는다. 이 문서들은 브라우저(HTML 표준) 기준이다. Node.js의 이벤트 루프 문서는 이번에 읽지 않았고, Node.js에서 같은 순서가 나왔다는 것만 실험으로 확인했다.
(실험 확인) Node.js v24.16.0에서 위 블록이 주석대로 나왔고, 같은 틱에서 `setTimeout` 두 개를 예약하고 첫 콜백 안에서 `then`을 걸면 그 `then`이 두 번째 타이머 콜백보다 먼저 실행됐다. `queueMicrotask`를 20만 번 재귀로 넣으면 `setTimeout(0)` 콜백은 그 루프가 끝난 뒤에야 실행됐고, 100ms 동안 동기 코드로 막으면 타이머가 100ms 이상 늦게 실행됐다.
