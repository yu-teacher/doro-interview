---
slug: "frt-05"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 2
title: "제어 컴포넌트와 비제어 컴포넌트는 무엇이 다른가요? input에서는 어떻게 구분하나요?"
keywords: ["value와 onChange로 제어", "defaultValue는 초기값만", "입력값을 state로 유지", "수명 동안 전환 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/reference/react-dom/components/input", "https://react.dev/learn/sharing-state-between-components"]
concepts: [react-state-rendering]
importance: 2
---
**모범 답변 (30~60초)**
input에서는 `value`(체크박스는 `checked`)를 넘기면 제어 컴포넌트이고, `defaultValue`만 주거나 아무것도 주지 않으면 비제어입니다. 제어 입력은 React가 항상 넘겨받은 값을 보여 주도록 강제하므로, 보통 값을 state에 두고 `onChange`에서 그 state를 동기적으로 갱신합니다. `onChange` 없이 `value`만 주면 입력할 때마다 값이 되돌아가서 타자를 칠 수 없습니다. 비제어는 `defaultValue`가 초기값만 정할 뿐 현재 값을 React가 정하지 않습니다. 한 입력이 수명 동안 둘 사이를 오갈 수 없으므로 제어 입력의 값은 `null`이나 `undefined`가 아닌 빈 문자열로 시작해야 합니다.

(공식 문서) React DOM의 `<input>` 레퍼런스는 `value`나 `checked`를 주면 제어 입력이 되고 그때는 `onChange`가 필요하다고 한다. `defaultValue`와 `defaultChecked`는 초기값만 정하는 비제어 입력용이며, 입력은 제어와 비제어를 동시에 할 수 없고 수명 중 전환도 안 된다고 한다. 제어 값에는 `null`이나 `undefined`를 주지 말고 빈 입력이면 빈 문자열로 초기화하라고 하며, `value`만 주고 `onChange`를 빼먹으면 입력이 안 되고 콘솔에 읽기 전용 경고가 뜬다고 한다. 제어 입력은 키 입력마다 state를 바꾸므로 큰 트리를 다시 렌더하면 느려질 수 있다고도 한다. Sharing State Between Components의 Deep Dive는 컴포넌트 수준에서 props가 구동하면 제어, 로컬 state가 구동하면 비제어라고 부르며 엄밀한 기술 용어는 아니라고 설명한다.
