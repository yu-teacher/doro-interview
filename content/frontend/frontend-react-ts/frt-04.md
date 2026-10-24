---
slug: "frt-04"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 1
title: "리스트를 렌더링할 때 key는 왜 필요하고, 배열 index를 key로 쓰면 왜 문제가 되나요?"
keywords: ["형제 중 고유한 식별자", "이동·삽입·삭제 추적", "index key는 순서가 바뀌면 버그", "렌더 중에 생성하지 않기"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/rendering-lists"]
concepts: [react-state-rendering]
importance: 2
links: [{to: "frt-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
key는 배열 항목이 형제들 사이에서 어느 것인지 React가 식별하게 하는 값입니다. 항목이 정렬로 이동하거나 삽입·삭제될 때 잘 고른 key가 있으면 React가 무슨 일이 일어났는지 추론해 올바르게 갱신합니다. key는 형제 사이에서 고유해야 하고 바뀌면 안 되므로, 데이터베이스 ID처럼 데이터에 붙은 안정적인 값을 쓰고 렌더 중에 `Math.random()`으로 만들면 안 됩니다. index는 항목이 삽입·삭제·재정렬되면 순서가 바뀌므로 미묘하고 혼란스러운 버그를 자주 부르는데, key를 아예 안 쓸 때 React가 기본으로 쓰는 값이 바로 index입니다.

(공식 문서) Rendering Lists는 key를 배열 항목을 형제 사이에서 유일하게 식별하는 문자열이나 숫자로 설명하고, 항목이 이동·삽입·삭제될 때 React가 일어난 일을 추론해 DOM을 올바르게 갱신하도록 돕는다고 한다. 규칙으로 형제 사이에서 유일해야 하고, 바뀌면 안 되며, 렌더 중에 생성하지 말라고 한다. 키의 출처로는 데이터베이스 ID, 로컬에서 만든 데이터라면 증가하는 카운터나 `crypto.randomUUID()` 같은 것을 든다. index를 키로 쓰면 순서가 바뀔 때 미묘하고 혼란스러운 버그가 자주 생긴다고 경고하며, 키를 지정하지 않으면 React가 index를 쓴다고 밝힌다. `key={Math.random()}`은 키가 렌더마다 달라져 모든 컴포넌트와 DOM을 다시 만들고 목록 안의 사용자 입력도 잃게 한다고 한다. 또 key는 props로 전달되지 않아 필요하면 별도 prop으로 넘겨야 한다.
