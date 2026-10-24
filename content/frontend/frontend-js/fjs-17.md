---
slug: "fjs-17"
topic: "frontend-js"
tier: TRICKY
difficulty: 2
title: "화살표 함수는 일반 함수와 무엇이 다르고, 객체의 메서드를 화살표 함수로 쓰면 왜 문제인가요?"
keywords: ["자기 this 가 없음", "바깥 스코프의 this 사용", "call·bind 로 this 변경 불가", "new 불가", "콜백에는 화살표가 유리"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-this-prototype]
importance: 2
links: [{to: "fjs-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
화살표 함수는 자기 `this`가 없어서 정의된 자리의 바깥 `this`를 그대로 씁니다. 그래서 객체 리터럴의 메서드를 화살표로 쓰면 `obj.method()`로 불러도 `this`는 `obj`가 아니라 바깥 스코프의 `this`라서 속성을 읽지 못하고, `call`이나 `bind`로도 바꿀 수 없습니다. 자기 `arguments`도 없고, `prototype`이 없어서 `new`로 호출하면 `TypeError`입니다. 반대로 메서드 안의 `map`이나 `setTimeout` 콜백을 화살표로 쓰면 바깥 메서드의 `this`가 유지되어 편합니다. 정리하면 객체 메서드는 메서드 문법으로, 콜백은 화살표로 씁니다.

```js
// CommonJS 모듈 최상위에서 실행 (바깥 this 는 module.exports)
const o = { v: 1, arrow: () => this.v, method() { return this.v; } };
o.arrow();                  // undefined
o.method();                 // 1
o.arrow.call({ v: 2 });     // undefined (call 로도 안 바뀜)
new (() => {})();           // TypeError
const t = { v: 1, later() { return [1].map(() => this.v)[0]; } };
t.later();                  // 1  (콜백 화살표는 later 의 this 유지)
```

(공식 문서) ECMA-262 9.1.1.3 Function Environment Records는 ArrowFunction이 아닌 함수에만 this 바인딩을 제공한다고 적고, 화살표 함수 정의 절의 Note는 화살표 함수가 `arguments`, `super`, `this`, `new.target`의 지역 바인딩을 만들지 않으며 이 이름이 바깥 환경에서 해석된다고 한다. OrdinaryCallBindThis는 ThisMode가 lexical이면 `this`를 바인딩하지 않고 끝난다. ArrowFunction의 평가는 OrdinaryFunctionCreate(lexical-this)와 SetFunctionName만 수행하고 MakeConstructor를 부르지 않으므로 생성자가 아니다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔다. 화살표 함수의 `prototype`은 `undefined`, 일반 함수는 `object`였다. CommonJS 최상위의 `this`는 `module.exports`와 같았다(ES 모듈 최상위의 `this`는 `undefined`).
(보충) '객체 메서드는 메서드 문법으로, 콜백은 화살표로'라는 정리는 표준의 권고가 아니라 널리 쓰이는 작성 관행이다.
