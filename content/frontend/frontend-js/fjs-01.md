---
slug: "fjs-01"
topic: "frontend-js"
tier: BASIC
difficulty: 1
title: "`var`, `let`, `const` 의 차이를 설명해 주세요."
keywords: ["var 는 함수 스코프", "let·const 는 블록 스코프", "const 는 재할당만 금지", "선언 전에는 접근 불가", "전역 var 는 전역 객체 속성"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://nodejs.org/docs/latest/api/globals.html"]
concepts: [js-scope-closure]
importance: 3
links: [{to: "fjs-02", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`var`는 함수 스코프이고 같은 이름을 다시 선언할 수 있으며, 스코프가 만들어질 때 `undefined`로 초기화됩니다. `let`과 `const`는 블록 스코프이고 선언문이 실행되기 전에는 접근할 수 없습니다. `const`는 재할당만 막을 뿐 객체 내부까지 얼리지는 않아서 `const` 객체의 속성은 바꿀 수 있습니다. 또 스크립트 최상위의 `var`는 전역 객체의 속성이 되지만 `let`과 `const`는 그렇지 않습니다. 실무에서는 기본을 `const`로 두고 재할당이 필요할 때만 `let`을 쓰며 `var`는 피하는 편입니다.

```js
// vm 컨텍스트의 전역 코드로 실행
var a = 1; let b = 2; const c = 3;
globalThis.a  // 1
globalThis.b  // undefined
globalThis.c  // undefined
```

(공식 문서) ECMA-262 14.3.1은 `let`·`const` 변수가 실행 컨텍스트의 LexicalEnvironment에 속하고, 환경이 만들어질 때 변수도 만들어지지만 LexicalBinding이 평가되기 전에는 어떤 방식으로도 접근할 수 없다고 한다. 14.3.2는 `var` 변수가 VariableEnvironment에 속하고 만들어질 때 `undefined`로 초기화되며, 한 VariableEnvironment 안에서 같은 이름의 선언이 여러 번 나와도 변수는 하나라고 한다. 9.1.1.4 Global Environment Records는 전역 코드의 `var`·함수 선언 바인딩은 전역 객체를 바탕으로 한 Object Environment Record에, 나머지 선언은 Declarative Environment Record에 둔다고 설명한다. 같은 사양의 Declarative Environment Record SetMutableBinding은 불변 바인딩에 값을 넣으려 하면 strict일 때 TypeError라고 하는데, `const` 바인딩은 BlockDeclarationInstantiation(14.2.3)·FunctionDeclarationInstantiation(10.2.11)에서 `CreateImmutableBinding(name, true)`, 즉 strict 불변 바인딩으로 만들어지므로(strict 바인딩이면 호출 쪽 strict 여부와 무관하게 strict로 취급한다는 규칙이 같은 메서드에 있다) 비엄격 코드에서도 TypeError다.
(공식 문서) Node.js globals 문서는 브라우저에서는 최상위 스코프가 전역 스코프라 `var`가 전역 변수가 되지만(ES 모듈 제외), Node.js 모듈의 최상위 `var`는 그 모듈 안에 머문다고 설명한다. 그래서 위 결과는 모듈이 아니라 전역 코드로 실행했을 때의 모습이다.
(실험 확인) Node.js v24.16.0에서 `vm.createContext`의 전역 코드로 위 블록을 실행했고, 함수 안의 `if` 블록에 `var x`, `let y`를 두면 블록 밖에서 `typeof x`는 `number`, `typeof y`는 `undefined`였다. `let z=1; let z=2;`는 SyntaxError, `const k=1; k=2;`는 비엄격 모드에서도 TypeError, `const o={n:1}; o.n=2;`는 성공했다.
(보충) 기본을 `const`로 하라는 것은 표준이 아니라 널리 쓰이는 작성 관행이다.
