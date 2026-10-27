---
slug: "fjs-04"
topic: "frontend-js"
tier: BASIC
difficulty: 1
title: "원시값과 참조값(객체)은 어떻게 다르고, 함수에 넘기면 어떻게 동작하나요?"
keywords: ["원시값은 값 자체를 복사", "객체는 같은 객체를 가리키는 참조 복사", "=== 는 같은 객체인지 비교", "속성 변경은 호출자에게 보임", "매개변수 재할당은 영향 없음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [type-system]
importance: 2
links: [{to: "fjs-05", kind: FOLLOWUP}, {to: "frt-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
원시값(숫자, 문자열, 불리언, `null`, `undefined`, 심볼, `BigInt`)은 값 자체가 복사되고 문자열 문자를 바꿀 수도 없습니다. 객체는 변수에 대입할 때 같은 객체를 가리키는 참조가 복사되므로 변수 두 개가 한 객체를 공유하고, `===`도 내용이 아니라 같은 객체인지를 비교해서 `{} === {}`는 `false`입니다. 함수 인자도 마찬가지로 값이 복사되어 넘어가는데 객체라면 그 값이 참조라서, 함수 안에서 속성을 바꾸면 호출한 쪽에서도 보이지만 매개변수를 다른 객체로 재할당해도 호출한 쪽 변수는 그대로입니다.

```js
let a = 1, b = a; b = 2;               // a 는 1
const o1 = { n: 1 }, o2 = o1; o2.n = 2; // o1.n 도 2
function mutate(o){ o.n = 99; }   mutate(o1);  // o1.n === 99
function reassign(o){ o = { n: -1 }; } reassign(o1); // o1.n 은 그대로 99
```

(공식 문서) ECMA-262 4.4.5는 원시값을 구현의 가장 낮은 수준에서 직접 표현되는 데이터이며 Undefined, Null, Boolean, Number, BigInt, Symbol, String 중 하나라고 정의하고, 4.4.6은 객체를 속성의 모음이라고 정의한다. 7.2.14 IsStrictlyEqual은 Number가 아닌 같은 타입의 값에는 SameValueNonNumber를 적용한다고 하고, 7.2.11 SameValueNonNumber는 `undefined`·`null`·BigInt·String·Boolean 외의 값은 정체성(identity)으로 비교한다고 적는다. 10.4.3.5 StringGetOwnProperty는 문자열의 인덱스 속성을 writable false로 돌려준다.
(실험 확인) Node.js v24.16.0에서 위 블록의 주석대로 나왔고 `{} === {}`는 `false`였으며, `let s='abc'; s[0]='X'`는 `s`를 바꾸지 못했고(비엄격 모드에서는 조용히 무시, strict 모드에서는 TypeError), `Object.freeze`한 객체의 중첩 객체 속성은 여전히 바뀌었다.
(보충) 인자 전달 방식을 '값에 의한 전달인데 객체의 값이 참조'라고 설명하는 것은 위 실험 동작을 정리한 해설이며, 사양이 쓰는 용어는 아니다.
