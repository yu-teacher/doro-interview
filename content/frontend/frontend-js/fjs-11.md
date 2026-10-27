---
slug: "fjs-11"
topic: "frontend-js"
tier: DEEP
difficulty: 2
title: "`class` 는 프로토타입과 어떤 관계인가요? 단순한 문법 설탕인가요?"
keywords: ["메서드는 prototype 에 정의", "extends 는 프로토타입 체인 연결", "new 없이 호출하면 TypeError", "메서드는 열거 불가", "항상 strict 모드"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-this-prototype]
importance: 2
links: [{to: "fjs-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
클래스도 내부적으로는 생성자 함수와 `prototype` 객체를 쓰는 프로토타입 기반입니다. 메서드는 `prototype`에 놓이고 `extends`는 `Child.prototype`의 프로토타입과 `Child` 자신의 프로토타입을 부모에 이어 줍니다. 다만 단순한 문법 설탕은 아니어서, `new` 없이 호출하면 `TypeError`가 나고 클래스 메서드는 열거되지 않아 `for...in`에 나오지 않으며, 클래스 본문은 항상 strict 모드이고 선언 전에 쓰면 TDZ 오류가 납니다. 자식 생성자에서는 `super()`를 호출하기 전에 `this`를 쓸 수 없습니다.

```js
class A { constructor(n) { this.n = n; } m() { return 'A.m'; } }
class B extends A { m() { return 'B>' + super.m(); } }
Object.getPrototypeOf(B) === A;                    // true
Object.getPrototypeOf(B.prototype) === A.prototype; // true
Object.getOwnPropertyDescriptor(A.prototype, 'm').enumerable; // false
A('x');  // TypeError: Class constructor A cannot be invoked without 'new'
```

(공식 문서) ECMA-262 15.7.13 ClassElementEvaluation은 클래스의 메서드 정의를 MethodDefinitionEvaluation에 enumerable 인자 `false`로 넘긴다고 적고, ClassDefinitionEvaluation은 `prototype`에 `constructor`를 enumerable false로 정의한다. 함수 `[[Call]]`은 `[[IsClassConstructor]]`가 true면 TypeError 객체를 만들어 던진다고 적는다. Strict Mode Code 절은 ClassDeclaration과 ClassExpression의 모든 부분이 strict mode code라고 한다. ClassDefinitionEvaluation(15.7.14)은 `extends`가 있으면 `proto`의 프로토타입을 부모의 `prototype`으로, 생성자 함수 자신의 프로토타입을 부모 클래스로 정하고, 비정적 메서드는 `proto`에 정적 메서드는 생성자 함수에 정의한다. `[[ConstructorKind]]`이 derived인 생성자는 `[[Construct]]`(10.2.2)에서 this를 바인딩하지 않으므로 `super()` 전에 `this`를 읽으면 GetThisBinding(9.1.1.3.3)이 ReferenceError를 던진다. 클래스 선언 같은 렉시컬 선언의 이름은 FunctionDeclarationInstantiation(10.2.11)에서 만들어지기만 하고 초기화되지 않는다.
(실험 확인) Node.js v24.16.0에서 위 블록이 주석대로 나왔다. 추가로 `class D extends A { constructor(){ this.x=1; super(); } }`는 ReferenceError, 선언 전 `new X()`는 ReferenceError였고, 함수 생성자의 `F.prototype.m = function(){}`는 열거 가능이라 `for...in`에 `'m'`이 나왔다.
