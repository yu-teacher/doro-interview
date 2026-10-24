---
slug: "fjs-08"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "클로저(closure)란 무엇이고, 어디에 쓰나요?"
keywords: ["함수가 만들어진 환경을 기억", "바깥 변수에 계속 접근", "호출마다 독립된 상태", "정보 은닉", "참조하는 동안 변수는 살아 있음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-scope-closure]
importance: 3
links: [{to: "fjs-16", kind: FOLLOWUP}, {to: "fjs-02", kind: PREREQ}, {to: "frt-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
클로저는 함수가 자신이 만들어진 스코프의 변수를 그 스코프 밖에서 호출될 때도 계속 쓸 수 있는 성질입니다. 표준으로는 함수 객체가 만들어질 때 그 시점의 환경을 `[[Environment]]`에 담아 두고, 호출될 때 그 환경을 바깥 환경으로 삼아 변수를 찾기 때문입니다. 그래서 카운터처럼 변수는 감추고 `inc` 같은 함수만 내보내는 정보 은닉이 가능하고, 호출할 때마다 새 환경이 생겨서 인스턴스끼리 상태가 독립됩니다. 다만 클로저가 환경을 참조하는 동안 그 변수는 살아 있으므로, 큰 객체를 오래 붙잡지 않도록 주의해야 합니다.

```js
function counter() { let n = 0; return { inc: () => ++n, get: () => n }; }
const c1 = counter(), c2 = counter();
c1.inc(); c1.inc(); c2.inc();
c1.get(); // 2
c2.get(); // 1   (호출마다 별도의 n)
```

(공식 문서) ECMA-262 OrdinaryFunctionCreate는 만들어지는 함수 객체의 `[[Environment]]`를 인자로 받은 환경 레코드로 설정한다고 적고, NewFunctionEnvironment는 함수 호출 시 만든 새 Function Environment Record의 `[[OuterEnv]]`를 `func.[[Environment]]`로 설정한다. 식별자는 이 바깥 환경 연결을 따라 해석되므로 함수는 만들어진 환경의 변수를 계속 볼 수 있다. 사양에 'closure'라는 낱말은 Abstract Closure(6.2.8)라는 사양 내부 알고리즘 도구로만 나오며 이는 자바스크립트 클로저 개념이 아니다. 즉 '클로저'는 사양의 정의 항목이 아니라 위 동작을 가리키는 통칭이다.
(실험 확인) Node.js v24.16.0에서 위 `counter`가 2와 1을 냈고, 같은 방식의 메모이제이션 함수(`Map` 캐시를 클로저로 보관)는 같은 인자로 세 번 호출해도 원 함수를 한 번만 실행했다.
(보충) 클로저가 잡고 있는 변수가 가비지 컬렉션 대상에서 빠진다는 설명은 구현(엔진)의 메모리 관리 이야기이며 이번에 읽은 사양 문장에는 근거가 없다. 엔진이 안 쓰는 변수를 최적화로 정리할 수도 있다.
