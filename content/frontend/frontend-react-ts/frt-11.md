---
slug: "frt-11"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "`useMemo`, `useCallback`, `memo`는 각각 무엇을 캐시하고, 어떤 경우에 쓸 만한가요? 모든 곳에 쓰면 안 되나요?"
keywords: ["useMemo는 계산 결과 캐시", "useCallback은 함수 자체 캐시", "props가 같으면 재렌더 생략", "성능 최적화일 뿐"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/reference/react/useMemo", "https://react.dev/reference/react/useCallback", "https://react.dev/reference/react/memo"]
concepts: [react-optimization, react-state-rendering]
importance: 2
---
**모범 답변 (30~60초)**
`useMemo`는 계산 결과를, `useCallback`은 함수 자체를 의존성이 같은 동안 재사용하게 하고, `memo`는 props가 이전과 같으면 컴포넌트의 재렌더를 건너뜁니다(보장은 아니고 최적화입니다). 비교는 `Object.is`로 하므로 렌더마다 새로 만든 객체나 함수를 props로 넘기면 `memo`가 소용없어지고, 그 값을 `useMemo`나 `useCallback`으로 고정하는 식으로 함께 씁니다. 공식 문서는 계산이 눈에 띄게 느리고 의존성이 드물게 바뀔 때, `memo` 컴포넌트에 넘기는 값일 때, 다른 Hook의 의존성일 때 같은 경우에만 가치가 있다고 설명합니다. 이들은 성능 최적화일 뿐이라 없어서 동작이 깨지면 다른 원인을 먼저 고쳐야 하고, 남용하면 가독성만 떨어집니다.

```js
function render() { return { fn: () => {}, opts: { a: 1 } }; }
const r1 = render(), r2 = render();
Object.is(r1.fn, r2.fn)       // false  (렌더마다 새 함수)
Object.is(r1.opts, r2.opts)   // false  (렌더마다 새 객체)
```

(공식 문서) useMemo 레퍼런스는 계산 결과를 렌더 사이에 캐시하는 Hook이며 의존성을 `Object.is`로 비교한다고 하고, 성능 최적화로만 의존해야 하며 없어서 동작이 깨지면 근본 문제를 먼저 고치라고 한다. 계산이 눈에 띄게 느리고 의존성이 드물게 바뀔 때, `memo` 컴포넌트에 prop으로 넘길 때, 다른 Hook의 의존성일 때만 가치가 있고, 그 외에는 이득이 없으며 큰 해도 없지만 가독성이 떨어지고 항상 새로운 값 하나가 메모이제이션 전체를 깰 수 있다고 한다. 측정 기준으로 상호작용 한 번에 로그된 시간 합계가 1ms 이상이면 고려할 만하다고 예시한다. useCallback 레퍼런스는 useMemo가 호출 결과를, useCallback이 함수 자체를 캐시한다고 구분하고, `memo`는 props가 같으면 재렌더를 건너뛰되 보장이 아니라 최적화라고 한다(memo 레퍼런스). 세 페이지 상단 노트는 React Compiler가 값, 함수, 컴포넌트를 자동으로 메모이제이션해 수동 호출의 필요를 줄인다고 안내한다.
(실험 확인) Node 24.16.0에서 위 코드를 실행한 결과가 주석이다. React가 아니라 함수 호출마다 새 객체와 함수가 생긴다는 JavaScript의 성질만 확인한 것이다.
