---
slug: "frt-17"
topic: "frontend-react-ts"
tier: TRICKY
difficulty: 3
title: "컴포넌트 함수 안에서 다른 컴포넌트를 정의하면 왜 입력값이 매 렌더마다 사라지나요? React는 state를 어떻게 보존하나요?"
keywords: ["state는 트리 위치에 연결", "같은 위치 같은 컴포넌트면 보존", "중첩 정의는 매번 다른 컴포넌트", "key를 바꿔 초기화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/preserving-and-resetting-state"]
concepts: [react-state-rendering]
importance: 1
links: [{to: "frt-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
React는 어느 state가 어느 컴포넌트의 것인지를 UI 트리에서 그 컴포넌트가 놓인 위치로 추적합니다. 같은 위치에 같은 컴포넌트를 계속 렌더하면 state가 보존되고, 제거되거나 같은 위치에 다른 컴포넌트가 오면 state가 버려집니다. 컴포넌트 안에 컴포넌트 함수를 정의하면 렌더마다 새 함수가 만들어지는데, React에게는 같은 위치에 다른 컴포넌트가 온 것이라서 그 아래 state가 전부 초기화됩니다. 그래서 공식 문서는 컴포넌트 함수를 항상 최상위에 선언하라고 합니다. 반대로 일부러 초기화하고 싶을 때는 같은 위치에서도 `key`를 바꾸면 됩니다.

(공식 문서) Preserving and Resetting State는 React가 어느 state가 어느 컴포넌트의 것인지를 UI 트리 안의 위치로 추적한다고 설명한다. 같은 위치에서 같은 컴포넌트를 렌더하는 동안 state가 유지되고, 컴포넌트를 제거하면 state가 파괴되며, 같은 위치에 다른 컴포넌트가 오면 그 서브트리 전체의 state가 초기화된다고 한다. JSX 마크업의 위치가 아니라 UI 트리의 위치가 기준이라 return 문이 둘로 나뉘어도 같은 위치면 state가 유지된다. 컴포넌트 함수를 다른 컴포넌트 안에 중첩 정의하면 렌더마다 다른 함수가 만들어져 입력의 state가 사라지며, 항상 최상위에 선언하고 중첩하지 말라고 한다. 같은 위치에서 state를 초기화하려면 `key`를 쓰고, key가 위치의 일부로 쓰여 서로 다른 컴포넌트로 취급된다고 한다.
