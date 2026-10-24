---
slug: "fjs-09"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "`this` 는 어떻게 결정되나요?"
keywords: ["호출 방식으로 결정", "메서드 호출은 점 앞 객체", "단독 호출은 strict 에서 undefined", "call·apply·bind 로 지정", "new 는 새로 만든 객체"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-this-prototype]
importance: 3
links: [{to: "fjs-10", kind: FOLLOWUP}, {to: "fjs-17", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`this`는 함수가 어디에 정의됐는지가 아니라 어떻게 호출됐는지로 정해집니다. `obj.f()`처럼 점으로 호출하면 `obj`이고, `f()`처럼 단독으로 호출하면 strict 모드에서는 `undefined`, 아니면 전역 객체입니다. `call`, `apply`, `bind`로 직접 지정할 수 있고, `bind`로 묶은 함수는 나중에 `call`로 다시 지정해도 바뀌지 않습니다. `new`로 호출하면 새로 만든 객체가 `this`입니다. 그래서 `const g = obj.f`처럼 메서드를 떼어 콜백으로 넘기면 `this`를 잃습니다. 화살표 함수는 자기 `this`가 없는 별개 규칙을 따릅니다.

```js
'use strict';
const obj = { name: 'obj', reg() { return this && this.name; } };
obj.reg();                        // 'obj'
const f = obj.reg; f();           // undefined
obj.reg.call({ name: 'other' });  // 'other'
const bound = obj.reg.bind({ name: 'first' });
bound.call({ name: 'second' });   // 'first'
```

(공식 문서) ECMA-262의 EvaluateCall은 호출 대상이 속성 참조(`obj.f`)면 그 참조의 this 값(기반 객체)을, 환경 참조면 환경의 WithBaseObject() 값을, 참조가 아니면 `undefined`를 this 값으로 넘긴다고 적는다. OrdinaryCallBindThis는 함수의 ThisMode가 lexical이면 바인딩하지 않고, strict면 받은 thisArg를 그대로 쓰며, 그 밖에는 thisArg가 `undefined`나 `null`일 때 전역 this 값을 쓰고 원시값이면 객체로 감싼다고 한다. 함수의 `[[Construct]]`(10.2.2)는 base 종류의 생성자에서 OrdinaryCreateFromConstructor로 새 객체를 만들어 this로 바인딩한다. 모듈 코드와 클래스 본문은 항상 strict라고 Strict Mode Code 절이 정한다.
(공식 문서) 같은 사양의 `Function.prototype.bind`는 BoundFunctionCreate(target, thisArg, args)로 묶인 함수 객체를 만든다고 적고, 묶인 함수의 `[[Call]]`(10.4.1.1)은 자신이 받은 thisArg를 쓰지 않고 저장해 둔 `[[BoundThis]]`로 대상 함수를 호출한다.
(실험 확인) Node.js v24.16.0에서 위 블록이 주석대로 나왔다. 비엄격 모드에서 `function show(){ return this === globalThis }`를 단독 호출하거나 객체에서 떼어낸 변수로 호출하면 `true`, `obj.show()`로 호출하면 `false`였고, `new Person('p')`의 `this`가 가리킨 객체는 `Person.prototype`을 프로토타입으로 가졌다.
