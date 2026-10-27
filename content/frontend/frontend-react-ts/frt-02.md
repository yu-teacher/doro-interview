---
slug: "frt-02"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 1
title: "`useState`가 왜 필요한가요? 그냥 지역 변수로는 왜 안 되나요?"
keywords: ["지역 변수는 렌더 사이에 유지 안 됨", "변경해도 렌더 미유발", "setter가 렌더 요청", "Hook은 최상위에서 호출"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/state-a-components-memory", "https://react.dev/learn/state-as-a-snapshot"]
concepts: [react-state-rendering]
importance: 3
links: [{to: "frt-03", kind: FOLLOWUP}, {to: "frt-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
지역 변수로는 두 가지가 안 됩니다. 첫째, 컴포넌트는 렌더될 때마다 함수가 처음부터 다시 실행되므로 지역 변수의 변경은 다음 렌더에 남지 않습니다. 둘째, 지역 변수를 바꿔도 React는 다시 렌더해야 한다는 사실을 알지 못합니다. `useState`가 이 둘을 해결합니다. 값은 함수 밖의 React가 기억해 두었다가 다음 렌더 때 돌려주고, setter 함수를 호출하면 값을 갱신하면서 다시 렌더를 요청합니다. 그리고 `useState` 같은 Hook은 조건문이나 반복문, 중첩 함수 안이 아니라 컴포넌트 최상위에서만 호출해야 합니다.

(공식 문서) State: A Component's Memory는 지역 변수가 렌더 사이에 유지되지 않고, 바꿔도 렌더가 트리거되지 않는다는 두 가지를 이유로 든다. `useState`가 데이터를 렌더 사이에 유지하는 state 변수와, 그 값을 갱신하며 렌더를 다시 일으키는 setter 함수를 제공한다고 설명하고, 호출마다 이 둘이 든 배열을 돌려준다고 한다. Hook은 컴포넌트나 커스텀 Hook의 최상위에서만 호출할 수 있고 조건문, 반복문, 중첩 함수 안에서는 안 된다고 한다. State as a Snapshot은 state가 함수의 변수처럼 사라지지 않고 함수 밖의 React 안에 있으며, React가 컴포넌트를 호출할 때 그 렌더의 스냅샷을 건네준다고 설명한다.
