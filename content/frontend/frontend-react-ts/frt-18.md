---
slug: "frt-18"
topic: "frontend-react-ts"
tier: TRICKY
difficulty: 2
title: "개발 모드에서 컴포넌트가 두 번 렌더되고 이펙트도 두 번 실행됩니다. 버그인가요? 컴포넌트는 왜 순수해야 하나요?"
keywords: ["렌더는 순수한 계산", "렌더 중 기존 변수 변경 금지", "Strict Mode는 개발 전용 점검", "부수 효과는 이벤트 핸들러에서"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/keeping-components-pure", "https://react.dev/reference/react/StrictMode", "https://react.dev/reference/react/useState"]
concepts: [react-effects, react-state-rendering]
importance: 1
links: [{to: "frt-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
버그가 아니라 Strict Mode가 개발 중에만 하는 점검입니다. React는 컴포넌트가 같은 props, state, context에 같은 JSX를 돌려주는 순수 함수라고 가정합니다. 그래서 컴포넌트 본문과 `useState`에 넘긴 함수, 업데이트 함수처럼 순수해야 하는 함수를 두 번 호출해서, 렌더 중에 바깥 변수를 바꾸는 식의 불순함을 드러냅니다. 이펙트도 설정과 정리를 한 번 더 돌려 정리 누락을 찾습니다. 프로덕션에는 영향이 없습니다. 렌더 중에 방금 만든 지역 객체를 바꾸는 건 괜찮지만, 기존 변수를 바꾸는 부수 효과는 보통 이벤트 핸들러에서 처리하고 정말 방법이 없을 때만 이펙트를 씁니다.

(공식 문서) Keeping Components Pure는 순수 함수를 기존 변수나 객체를 바꾸지 않고(자기 일만 하고), 같은 입력에 같은 결과를 내는 함수로 정의하며, React가 모든 컴포넌트를 순수 함수로 가정한다고 한다. Strict Mode는 개발 중 컴포넌트 함수를 두 번 호출해 이를 어긴 컴포넌트를 찾게 해 주고 프로덕션에서는 영향이 없다고 한다. 렌더 중 같은 렌더 안에서 만든 지역 변수를 바꾸는 지역 변경은 괜찮다고 하고, 부수 효과는 보통 렌더 중이 아니라 이벤트 핸들러에 두며 다른 방법이 없을 때만 `useEffect`를 마지막 수단으로 쓰라고 한다. StrictMode 레퍼런스는 개발 전용 동작으로 컴포넌트 추가 재렌더, 이펙트 추가 재실행, ref 콜백 추가 재실행, 폐지된 API 검사를 들고, 두 번 호출되는 함수에 컴포넌트 본문(이벤트 핸들러 안 코드는 제외)과 `useState`, set 함수, `useMemo`, `useReducer`에 넘긴 함수가 포함된다고 한다. 앱 일부에만 적용하면 프로덕션에서 가능한 동작만 켠다고 한다.
