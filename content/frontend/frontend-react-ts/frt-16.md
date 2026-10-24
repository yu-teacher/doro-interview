---
slug: "frt-16"
topic: "frontend-react-ts"
tier: TRICKY
difficulty: 2
title: "`setNumber(number + 1)`을 세 번 호출했는데 왜 1만 늘어나나요? 어떻게 고치나요?"
keywords: ["렌더마다 고정된 state 스냅샷", "setter는 다음 렌더를 위한 요청", "업데이트 함수 큐", "이벤트 핸들러 뒤 일괄 처리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/state-as-a-snapshot", "https://react.dev/learn/queueing-a-series-of-state-updates", "https://react.dev/reference/react/useState"]
concepts: [react-state-rendering]
importance: 2
links: [{to: "frt-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
state는 렌더마다 값이 고정된 스냅샷이기 때문입니다. 그 렌더의 핸들러 안에서 `number`는 0이라서, `setNumber(number + 1)`을 세 번 불러도 세 번 모두 0 + 1, 즉 1로 바꾸라는 요청입니다. 게다가 React는 핸들러의 코드가 다 끝난 뒤 업데이트를 한꺼번에 처리하는 배칭을 하므로 그 사이에 값이 바뀌지도 않습니다. 이전 값을 기준으로 이어서 계산하려면 `setNumber(n => n + 1)`처럼 업데이트 함수를 넘깁니다. 그러면 React가 큐에 쌓인 함수를 순서대로 적용해 최종 3이 됩니다. 같은 이유로 `setTimeout` 안에서 읽은 값도 클릭 당시의 값입니다.

```js
function renderCounter(number) { return () => setTimeout(() => console.log('number =', number), 0); }
let n = 0; const handler0 = renderCounter(n); n = 1; handler0();   // 출력: number = 0
```

(공식 문서) State as a Snapshot은 렌더가 컴포넌트 함수 호출이고, 그 렌더의 props, 이벤트 핸들러, 지역 변수가 모두 그 렌더 시점의 state로 계산된다고 설명한다. 같은 렌더의 핸들러에서 `setNumber(number + 1)`을 세 번 호출하면 `number`가 계속 0이라 세 번 모두 1로 설정하게 되어 한 번에 1만 늘고, 비동기로 알림을 띄워도 클릭 당시의 값이 나온다고 한다. Queueing a Series of State Updates는 React가 이벤트 핸들러의 모든 코드가 실행된 뒤에 업데이트를 처리하며(배칭), 같은 state를 여러 번 갱신하려면 `n => n + 1` 같은 업데이트 함수를 넘기라고 한다. 업데이트 함수는 큐에 쌓였다가 다음 렌더에서 이전 결과를 받아 순서대로 적용되고, 일반 값은 큐에 '그 값으로 교체'를 넣는다고 한다. 업데이트 함수는 렌더 중에 실행되므로 순수해야 한다. useState 레퍼런스도 set 함수가 다음 렌더의 값만 바꾸고 이미 실행 중인 코드의 변수는 바꾸지 않는다고 한다.
(실험 확인) Node 24.16.0에서 위 코드를 실행하면 `number = 0`이 출력된다. React가 아니라 클로저가 만들어질 때의 값을 붙잡는 JavaScript의 성질만 확인한 것이며, 문서의 스냅샷 설명과 같은 원리의 유사 예이다.
