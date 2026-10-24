---
slug: "fjs-02"
topic: "frontend-js"
tier: BASIC
difficulty: 1
title: "호이스팅이란 무엇이고, TDZ(일시적 사각지대)는 무엇인가요?"
keywords: ["선언이 먼저 만들어짐", "var 는 undefined 로 초기화", "let·const 는 초기화 전 접근 시 ReferenceError", "함수 선언문은 통째로 올라옴", "함수 표현식 var 는 TypeError"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [js-scope-closure]
importance: 2
links: [{to: "fjs-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
호이스팅은 코드가 실행되기 전에 스코프 안의 선언들이 먼저 만들어지는 현상을 부르는 통칭입니다. `var` 변수는 만들어질 때 `undefined`로 초기화되어서 선언 위에서 읽으면 `undefined`가 나옵니다. `let`, `const`, `class`도 만들어지기는 하지만 선언문이 실행될 때까지 초기화되지 않아서, 그 구간에서 접근하면 `ReferenceError`가 나고 이 구간을 TDZ라고 부릅니다. 함수 선언문은 함수 본문까지 통째로 준비되어 선언 위에서 호출할 수 있지만, `var f = function(){}`처럼 함수 표현식을 담은 `var`는 변수만 준비되므로 위에서 호출하면 `TypeError`입니다.

```js
(function(){ return hv; var hv = 5; })();          // undefined
(function(){ console.log(tl); let tl = 1; })();    // ReferenceError: Cannot access 'tl' before initialization
(function(){ return g(); function g(){ return 'ok'; } })(); // 'ok'
(function(){ return fe(); var fe = function(){}; })();      // TypeError: fe is not a function
```

(공식 문서) ECMA-262 14.3.1은 `let`·`const`가 환경이 만들어질 때 생성되지만 LexicalBinding이 평가되기 전에는 접근할 수 없다고 하고, 14.3.2는 `var`가 생성 시점에 `undefined`로 초기화된다고 한다. 10.2.11 FunctionDeclarationInstantiation은 함수 진입 때 함수 선언의 함수 객체를 만들어 변수 바인딩에 넣고(그래서 선언 위에서 호출할 수 있다), `let`·`const`·`class` 같은 렉시컬 선언의 이름은 '만들기만 하고 초기화하지는 않는다'고 주석으로 적는다. 사양 전체에서 'hoisted'라는 낱말은 두 군데뿐이다. 하나는 BindingInitialization(8.6.2)에서 `var`의 바인딩이 미리 만들어지고 초기화된다는 보조 설명이고, 다른 하나는 TypedArray 경계 검사 최적화를 말하는 무관한 주석이다. 'HoistableDeclaration'은 함수·제너레이터 선언을 묶는 문법 이름일 뿐이고, 'temporal dead zone'이라는 용어는 본문에 없다. 즉 호이스팅과 TDZ는 이 동작을 가리키는 통칭이다.
(실험 확인) Node.js v24.16.0에서 위 네 줄이 주석의 결과를 냈다. 추가로 `new K(); class K{}`도 ReferenceError, `let x = x + 1`도 ReferenceError, TDZ 안의 `typeof tz`도 ReferenceError였고 선언하지 않은 이름의 `typeof`만 `'undefined'`였다.
