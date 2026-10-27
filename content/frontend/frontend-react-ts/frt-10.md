---
slug: "frt-10"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "`useEffect`가 필요 없는 경우는 언제인가요? 이펙트로 state를 맞추면 왜 문제가 되나요?"
keywords: ["외부 시스템과 동기화", "렌더 중에 계산", "이벤트 핸들러에서 처리", "key로 상태 초기화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/you-might-not-need-an-effect"]
concepts: [react-effects, react-state-rendering]
importance: 2
links: [{to: "frt-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
이펙트는 렌더 밖의 외부 시스템, 예를 들어 비React 위젯이나 네트워크, 브라우저 DOM과 동기화할 때 쓰는 탈출구라서, 외부 시스템이 없으면 보통 필요하지 않습니다. props나 state로 계산할 수 있는 값을 이펙트로 또 다른 state에 복사하면 오래된 값으로 한 번 렌더하고 곧바로 다시 렌더하는 낭비가 생기므로, 그냥 렌더 중에 계산하고 비싸면 `useMemo`로 캐시합니다. 클릭 같은 사용자 동작으로 일어나는 일은 무슨 일이 있었는지 아는 이벤트 핸들러에서 처리합니다. prop이 바뀔 때 상태 전체를 초기화하고 싶다면 이펙트 대신 컴포넌트에 `key`를 주면 됩니다.

(공식 문서) You Might Not Need an Effect는 이펙트를 React 패러다임 밖의 외부 시스템과 동기화하는 탈출구라고 하고, 외부 시스템이 없다면(props나 state 변화에 맞춰 state를 갱신하는 경우 등) 이펙트가 필요 없다고 한다. 렌더용 데이터 변환에 이펙트를 쓰면 렌더, 커밋, 이펙트, 상태 갱신으로 다시 처음부터 도는 비효율이 생기고, 파생 값은 렌더 중에 계산하며 비싼 계산은 `useMemo`로 캐시하라고 한다. 사용자 이벤트는 이벤트 핸들러에서 처리하라고 하는데, 이펙트가 돌 때는 어떤 버튼이 눌렸는지 알 수 없기 때문이라고 한다. 이펙트냐 핸들러냐의 기준은 로직이 특정 상호작용 때문인지, 사용자가 화면에 컴포넌트를 보았기 때문인지라고 한다. prop 변경 시 전체 state 초기화에는 `key`를 쓰라고 한다. 데이터 가져오기는 이펙트로 가능하지만 경쟁 상태를 막으려면 정리 함수가 필요하고, 프레임워크의 내장 방식이 더 효율적이라고 한다.
