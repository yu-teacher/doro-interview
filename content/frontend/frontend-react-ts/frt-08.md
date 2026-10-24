---
slug: "frt-08"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "`useEffect`의 의존성 배열은 무엇이고, 생략했을 때·빈 배열일 때·값이 있을 때 각각 언제 실행되나요?"
keywords: ["반응형 값을 모두 나열", "Object.is로 비교", "[]는 마운트 때 한 번", "생략하면 매 커밋 뒤 실행"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/reference/react/useEffect", "https://react.dev/learn/lifecycle-of-reactive-effects", "https://react.dev/learn/synchronizing-with-effects"]
concepts: [react-effects]
importance: 3
links: [{to: "frt-09", kind: FOLLOWUP}, {to: "frt-10", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
의존성 배열은 이펙트 코드 안에서 읽는 반응형 값의 목록입니다. 반응형 값은 props, state, 그리고 컴포넌트 본문에 선언된 변수와 함수입니다. 개발자가 고르는 게 아니라 코드가 쓰는 값에 따라 정해지고, 빠뜨리면 린터가 잡아 줍니다. 값이 있으면 첫 커밋 뒤에 실행되고, 이후에는 React가 이전 값과 `Object.is`로 비교해 하나라도 달라졌을 때만 정리 함수를 먼저, 이어서 새 값으로 설정 코드를 다시 실행합니다. 배열을 생략하면 매 커밋 뒤에 실행되고, 빈 배열 `[]`은 코드가 반응형 값을 쓰지 않는다는 뜻이라 마운트 때 한 번 설정되고 언마운트 때 정리됩니다. 의존성은 일부러 뺄 수 없고, 빼려면 그 값을 반응형이 아니게 바꿔야 합니다.

(공식 문서) useEffect 레퍼런스는 dependencies를 설정 코드 안에서 참조하는 모든 반응형 값의 목록이라고 정의하고, 반응형 값에는 props와 컴포넌트 본문에 선언된 모든 변수와 함수가 포함된다고 한다. React가 각 의존성을 이전 값과 `Object.is`로 비교하며 인자를 생략하면 매 커밋 뒤에 다시 실행된다고 한다. 의존성을 지정하면 첫 커밋 뒤와 의존성이 바뀐 커밋 뒤에 실행된다. 의존성이 바뀐 커밋 뒤에는 이전 값으로 정리 함수가 먼저, 그다음 새 값으로 설정 함수가 실행된다. Lifecycle of Reactive Effects는 의존성을 '선택'할 수 없고 코드가 결정하며, 의존성을 없애려면 값을 컴포넌트 밖으로 옮기는 식으로 반응형이 아니게 만들어야 한다고 한다. 반응형 값을 쓰지 않는 이펙트의 빈 배열은 컴포넌트 입장에서 마운트 때만 연결하고 언마운트 때만 해제한다는 뜻이라고 한다(개발 모드에서는 한 번 더 동기화한다). `location.pathname`이나 `ref.current` 같은 가변 값은 반응형이 아니라 의존성이 될 수 없다고 한다. Synchronizing with Effects는 배열이 없는 경우와 빈 배열인 경우의 동작이 다르다고 한다.
