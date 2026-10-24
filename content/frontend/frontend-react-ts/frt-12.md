---
slug: "frt-12"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "여러 컴포넌트가 같은 상태를 써야 할 때 상태 끌어올리기와 Context 중 무엇을 고르나요?"
keywords: ["가장 가까운 공통 부모로 끌어올리기", "prop drilling", "children으로 컴포넌트 추출", "Context는 그다음 선택지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/sharing-state-between-components", "https://react.dev/learn/passing-data-deeply-with-context"]
concepts: [react-state-rendering]
importance: 2
---
**모범 답변 (30~60초)**
두 컴포넌트가 항상 함께 바뀌어야 하면 각자의 state를 없애고, 가장 가까운 공통 부모로 state를 끌어올려 props로 내려 줍니다. 그런데 공통 부모가 멀면 중간 컴포넌트들이 쓰지도 않는 props를 계속 전달하는 prop drilling이 생깁니다. 공식 문서는 Context를 쓰기 전에 먼저 props로 명시적으로 전달해 보고, 그다음 컴포넌트를 추출해 JSX를 `children`으로 넘겨서 중간 층을 줄여 보라고 권고합니다. 둘 다 안 맞을 때 Context를 고려하라는 것이고, 테마나 현재 로그인 계정, 라우팅 같은 용도를 예로 듭니다. Context 값이 바뀌면 그 값을 읽는 아래 컴포넌트가 모두 갱신됩니다.

(공식 문서) Sharing State Between Components는 두 컴포넌트의 state가 항상 같이 바뀌어야 하면 양쪽에서 state를 빼서 가장 가까운 공통 부모로 옮기고 props로 내려 주는 것을 상태 끌어올리기라고 부른다. Passing Data Deeply with Context는 공통 조상이 너무 멀어 중간 컴포넌트를 거쳐 props를 넘기게 되는 상황을 prop drilling이라 부르고, Context가 부모의 정보를 깊이와 상관없이 아래 어느 컴포넌트에든 제공한다고 설명한다. Before you use context 절은 Context가 너무 쉽게 남용된다고 경고하면서 먼저 props로 넘기고, 그다음 컴포넌트를 추출해 `children`으로 넘기고, 둘 다 맞지 않으면 Context를 고려하라고 권고한다. 용례로 테마, 현재 계정, 라우팅, reducer와 함께 쓰는 상태 관리를 든다. 다른 값을 다음 렌더에 넘기면 아래에서 그 Context를 읽는 모든 컴포넌트가 갱신된다고 한다.
