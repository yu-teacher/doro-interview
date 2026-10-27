---
slug: "fjs-16"
topic: "frontend-js"
tier: TRICKY
difficulty: 2
title: "`for (var i...)` 루프 안의 `setTimeout` 콜백은 왜 모두 같은 값을 출력하고, `let` 으로 바꾸면 왜 달라지나요?"
keywords: ["var 는 변수 하나를 공유", "콜백은 루프가 끝난 뒤 실행", "let 은 반복마다 새 바인딩", "반복마다 이전 값 복사", "즉시 실행 함수로 값 고정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html"]
concepts: [js-scope-closure, js-event-loop]
importance: 2
links: [{to: "fjs-01", kind: PREREQ}, {to: "fjs-08", kind: PREREQ}, {to: "fjs-15", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`var i`는 함수 스코프에 변수가 하나뿐이라서 콜백들이 모두 같은 `i`를 참조하는데, 콜백은 루프가 다 끝난 뒤에 실행되므로 최종 값인 3을 세 번 봅니다. `let i`를 쓰면 반복마다 새 바인딩이 만들어져서 각 콜백이 그 반복의 값을 기억합니다. 표준은 반복의 본문이 끝날 때마다 증가식을 실행하기 전에 환경을 새로 만들어 현재 값을 옮긴다고 정해 두고 있어서, 본문에서 `i`를 바꾸면 그 값이 다음 반복으로 이어집니다. 즉시 실행 함수로 인자를 넘겨 값을 고정해도 같은 결과를 얻을 수 있습니다.

```js
const a = []; for (var i = 0; i < 3; i++) a.push(() => i);
a.map(f => f());   // [3, 3, 3]
const b = []; for (let j = 0; j < 3; j++) b.push(() => j);
b.map(f => f());   // [0, 1, 2]
const e = []; for (let q = 0; q < 3; q++) { e.push(() => q); q++; }
e.map(f => f());   // [1, 3]  (본문에서 올린 q 가 다음 반복으로 복사됨)
```

(공식 문서) ECMA-262 14.3.2는 `var`가 실행 컨텍스트의 VariableEnvironment에 속한다고 하고, 14.7.4.3 ForBodyEvaluation은 루프 시작 전에 한 번, 그리고 본문 평가를 마칠 때마다 증가식을 평가하기 전에 CreatePerIterationEnvironment(14.7.4.4)를 수행한다. CreatePerIterationEnvironment는 새 DeclarativeEnvironment를 만들어 이전 반복 환경의 바인딩 값으로 초기화한다고 적는다.
(공식 문서) HTML 표준의 timer initialization steps는 `setTimeout` 콜백을 timer task source의 태스크로 큐잉하므로 현재 실행 중인 동기 코드(루프)가 끝난 뒤에 실행된다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔고, 즉시 실행 함수 방식(`(function(k){ ... })(k)`)은 `[0, 1, 2]`였다. `setTimeout` 버전도 `var`는 `var3, var3, var3`, `let`은 `let0, let1, let2`를 찍었다.
