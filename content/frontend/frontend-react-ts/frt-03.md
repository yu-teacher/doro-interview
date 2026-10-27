---
slug: "frt-03"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 1
title: "React 상태가 객체나 배열일 때 직접 수정하지 않고 새 객체로 교체해야 하는 이유는 무엇인가요?"
keywords: ["상태는 읽기 전용으로 취급", "setter 없이는 변경을 모름", "스프레드로 복사해서 교체", "얕은 복사 주의"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/learn/updating-objects-in-state", "https://react.dev/reference/react/useState"]
concepts: [react-state-rendering]
importance: 3
---
**모범 답변 (30~60초)**
React는 setter를 거치지 않은 객체 변경을 알아채지 못하기 때문입니다. 상태 객체의 `position.x = 5`처럼 직접 바꾸면 값은 바뀌어도 렌더가 일어나지 않아 화면이 그대로일 수 있습니다. 그래서 공식 문서는 상태에 든 객체도 숫자나 문자열처럼 읽기 전용으로 취급하고, 새 객체를 만들어 setter로 교체하라고 안내합니다. 보통 `{ ...person, name: 'b' }`처럼 스프레드로 복사하는데, 스프레드는 한 단계만 복사하는 얕은 복사라서 중첩 객체의 값을 바꾸려면 안쪽 객체도 따로 복사해야 합니다. 방금 새로 만든 객체를 고치는 지역 변경은 괜찮습니다.

```js
const p1 = { name: 'a', artwork: { city: 'Seoul' } };
const p2 = { ...p1, name: 'b' };
p1.artwork === p2.artwork   // true  (중첩 객체는 같은 객체를 공유)
const p3 = { ...p1, artwork: { ...p1.artwork, city: 'Busan' } };
p1.artwork.city             // 'Seoul' (원본 유지)
p3.artwork.city             // 'Busan'
```

(공식 문서) Updating Objects in State는 객체가 기술적으로는 바꿀 수 있지만 state에 넣은 객체는 불변인 것처럼 취급해 항상 교체하라고 권고한다. setter 없이 객체를 바꾸면 React가 변경을 알 수 없어 아무 반응도 하지 않는다고 하고(경우에 따라 동작할 수는 있어도 권장하지 않는다고 한다), 방금 만든 객체를 바꾸는 지역 변경은 아직 아무도 참조하지 않아 문제가 없다고 한다. 스프레드 문법은 한 단계만 복사하는 얕은 복사라 중첩 속성을 바꾸려면 여러 번 써야 한다고 한다. useState 레퍼런스는 새 값이 현재 state와 `Object.is`로 같으면 React가 그 컴포넌트와 자식의 재렌더를 건너뛴다고 하므로, 같은 객체를 고쳐서 다시 넘기는 방식은 이 점에서도 맞지 않는다.
(실험 확인) Node 24.16.0에서 위 코드를 실행한 결과가 주석의 값이다. React가 아니라 JavaScript의 복사 동작만 확인한 것이다.
