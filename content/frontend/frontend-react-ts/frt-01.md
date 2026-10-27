---
slug: "frt-01"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 1
title: "React가 '선언적'이라는 말은 무슨 뜻이고, 화면이 갱신되는 과정은 어떻게 되나요?"
keywords: ["상태에 따른 UI 기술", "트리거·렌더·커밋", "렌더는 컴포넌트 호출", "변경된 DOM만 반영"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/reacting-to-input-with-state", "https://react.dev/learn/render-and-commit"]
concepts: [react-state-rendering]
importance: 3
links: [{to: "frt-02", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
선언적이라는 건 UI를 요소별로 명령해서 조작하는 대신, 컴포넌트가 가질 수 있는 화면 상태를 기술하고 사용자 입력에 따라 상태를 바꾸는 방식이라는 뜻입니다. 화면 갱신은 세 단계입니다. 먼저 최초 렌더이거나 상태가 바뀌어서 렌더가 트리거됩니다. 다음 렌더 단계에서 React가 컴포넌트 함수를 호출해 무엇을 그릴지 계산합니다. 마지막 커밋 단계에서 DOM에 반영하는데, 이전 렌더와 결과가 같으면 DOM을 건드리지 않고 다르면 필요한 최소한의 변경만 적용합니다. 렌더는 DOM 갱신이 아니라 컴포넌트 호출이라는 점이 핵심입니다.

(공식 문서) React Learn의 Reacting to Input with State는 React가 UI를 직접 조작하는 대신 컴포넌트가 가질 수 있는 시각적 상태를 기술하고 입력에 따라 전환하게 하는 선언적 방식을 제공한다고 설명한다. 반대인 명령형 방식은 요소 하나하나를 어떻게 바꿀지 지시해야 해서 시스템이 복잡해질수록 관리가 어려워진다고 대비한다. Render and Commit은 화면 갱신을 트리거, 렌더, 커밋의 세 단계로 나누고, 트리거 이유를 최초 렌더와 해당 컴포넌트(또는 조상)의 state 갱신 두 가지로 든다. 렌더는 React가 컴포넌트를 호출하는 일이고 재렌더에서는 달라진 속성을 계산만 할 뿐 DOM은 커밋 단계에서 건드린다. 커밋에서 초기 렌더는 `appendChild()`로 노드를 붙이고, 재렌더는 렌더 중 계산한 최소한의 연산을 적용하며, 렌더 결과가 같으면 DOM을 건드리지 않는다고 한다. 그 뒤에 브라우저가 화면을 다시 그린다(페인트).
