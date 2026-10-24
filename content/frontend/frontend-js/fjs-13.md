---
slug: "fjs-13"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "`Promise.all`, `allSettled`, `race`, `any` 는 각각 어떻게 다른가요?"
keywords: ["all 은 하나라도 거부되면 즉시 거부", "allSettled 는 모두 끝나야 이행", "race 는 가장 먼저 확정된 결과", "any 는 가장 먼저 이행된 값", "전부 거부되면 AggregateError"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-event-loop]
importance: 2
links: [{to: "fjs-12", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`Promise.all`은 전부 이행되면 입력 순서대로 값의 배열로 이행하고, 하나라도 거부되면 그 첫 사유로 즉시 거부합니다. `allSettled`는 모두 끝날 때까지 기다린 뒤 각각의 상태 스냅샷 배열로 이행하며 입력 프로미스가 거부돼도 거부되지 않습니다. `race`는 가장 먼저 확정된 결과가 이행이든 거부든 그대로 따라가고, `any`는 가장 먼저 이행된 값으로 이행하되 전부 거부되면 `AggregateError`로 거부합니다. 서로 독립인 작업은 `await`를 줄줄이 쓰는 순차 실행보다 `all`로 동시에 시작하는 편이 전체 시간이 짧고, 일부 실패를 허용하려면 `allSettled`를 씁니다.

```js
const sleep = (ms, v, fail) => new Promise((res, rej) =>
  setTimeout(() => (fail ? rej(new Error(v)) : res(v)), ms));
await Promise.all([sleep(20, 'a'), sleep(10, 'b')]);        // ['a', 'b']  (입력 순서)
await Promise.all([sleep(10, 'x', true), sleep(30, 'y')]);  // 10ms 에 즉시 거부
(await Promise.allSettled([sleep(5, 'ok'), sleep(5, 'bad', true)])).map(r => r.status);
                                                           // ['fulfilled', 'rejected']
await Promise.race([sleep(30, 'slow'), sleep(5, 'fast')]);  // 'fast'
await Promise.any([sleep(5, 'e1', true), sleep(15, 'good')]); // 'good'
```

(공식 문서) ECMA-262 27.5.4.1은 `Promise.all`이 이행값 배열로 이행하거나 처음 거부된 프로미스의 사유로 거부하는 프로미스를 돌려준다고 하고, 27.5.4.2는 `allSettled`가 모든 원본이 settle된 뒤에야 상태 스냅샷 배열로 이행하는 프로미스를 돌려준다고 한다. 값은 PerformPromiseAll이 `values[thisIndex]`에 채우므로 입력 순서를 따른다. 27.5.4.3은 `any`가 처음 이행된 값으로 이행하거나 전부 거부되면 거부 사유를 담은 AggregateError로 거부한다고 하고, 27.5.4.5는 `race`가 처음 settle된 방식 그대로 settle되는 프로미스를 돌려준다고 한다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔다. 모두 거부되는 `any`는 `AggregateError`(`errors.length === 2`)로 거부됐고, 먼저 거부된 쪽이 있으면 `race`도 그 사유로 거부됐으며, 입력이 이터러블이 아닌 `Promise.allSettled(5)`는 TypeError로 거부됐다. 50ms 대기를 `await` 두 번(순차)으로 하면 95ms 이상, `Promise.all`로 하면 90ms 미만이었다. 타이머 정밀도에 따라 값은 달라질 수 있다.
