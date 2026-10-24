---
slug: "fjs-05"
topic: "frontend-js"
tier: BASIC
difficulty: 2
title: "얕은 복사와 깊은 복사는 무엇이 다르고, `structuredClone` 은 어떻게 쓰나요?"
keywords: ["얕은 복사는 중첩 객체를 공유", "스프레드·Object.assign 은 얕은 복사", "structuredClone 은 깊은 복사", "순환 참조 보존", "함수는 복사 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://html.spec.whatwg.org/multipage/structured-data.html", "https://nodejs.org/docs/latest/api/globals.html"]
concepts: [type-system, immutability]
importance: 2
links: [{to: "fjs-04", kind: PREREQ}, {to: "frt-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
얕은 복사는 최상위 속성만 새 객체로 옮기고 중첩된 객체는 같은 참조를 공유하는 복사로, 스프레드(`{...o}`)와 `Object.assign`, 배열의 `slice`가 여기에 속합니다. 깊은 복사는 중첩 객체까지 새로 만들어서 원본과 완전히 분리되는 복사입니다. 표준 함수인 `structuredClone`이 이를 해 주고, `Date`, `Map`, `Set`, `RegExp`, `BigInt`와 순환 참조까지 보존한 채 복사합니다. 반면 함수나 심볼이 들어 있으면 `DataCloneError`가 나서 만능은 아닙니다. `JSON.parse(JSON.stringify(o))`는 `Date`를 문자열로 바꾸고 순환 참조에서는 `TypeError`가 납니다.

```js
const o = { n: 1, nested: { m: 2 }, d: new Date(0), mp: new Map([['a', 1]]) };
({ ...o }).nested === o.nested          // true  (공유)
structuredClone(o).nested === o.nested  // false (분리)
structuredClone(o).d instanceof Date    // true
structuredClone({ f() {} })             // DataCloneError
```

(공식 문서) ECMA-262 20.1.2.1 `Object.assign`은 출처 객체의 열거 가능한 own 속성의 값을 대상 객체로 복사한다고 하고, 객체 리터럴의 스프레드는 7.3.25 CopyDataProperties(열거 가능한 own 속성 값을 `Get`으로 읽어 새 객체에 만든다)를 쓰며, `Array.prototype.slice`(23.1.3.28)는 요소를 새 배열에 옮기므로 값이 객체이면 그 참조가 복사된다. HTML Living Standard 2.7.11(Structured cloning API)은 `structuredClone`이 '구조화 복제 알고리즘으로 깊은 복사를 돌려준다'고 설명하고, 메서드 단계는 StructuredSerializeWithTransfer로 직렬화한 뒤 역직렬화한 결과를 돌려준다. 2.7.4 StructuredSerializeInternal 직렬화 알고리즘은 이미 만난 객체를 memory 맵에 기록해 순환과 같은 객체의 정체성을 보존하고, Boolean·Number·BigInt·String·Date·RegExp·ArrayBuffer·Map·Set·Error·Array 등을 지원하며, Symbol과 호출 가능한 객체(함수), Promise·WeakMap처럼 내부 슬롯이 따로 있는 객체, 프록시 같은 exotic 객체는 `DataCloneError`를 던진다고 적는다.
(공식 문서) Node.js globals 문서는 `structuredClone(value[, options])`를 WHATWG의 `structuredClone`이라고 소개한다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔고, 순환 객체는 `structuredClone`으로 복사됐지만(`copy.self === copy`) `JSON.stringify`는 TypeError였다. `JSON.stringify` 경로는 `Date`가 문자열이 되고 `Set`·`Map`·`RegExp`가 `{}`가 되며 `undefined` 값 키가 사라지고 `BigInt`가 있으면 TypeError였다.
