---
slug: "fjs-03"
topic: "frontend-js"
tier: BASIC
difficulty: 1
title: "`==` 와 `===` 의 차이는 무엇인가요?"
keywords: ["=== 는 타입이 다르면 false", "== 는 타입 변환 후 비교", "null == undefined", "NaN 은 자기 자신과 같지 않음", "Object.is"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/"]
concepts: [type-system]
importance: 3
---
**모범 답변 (30~60초)**
`===`는 두 값의 타입이 다르면 곧바로 `false`이고, 타입이 같을 때만 값을 비교합니다. `==`는 타입이 다르면 정해진 규칙에 따라 변환한 뒤 비교해서 `0 == '0'`, `'' == 0`, `[] == ''`이 모두 `true`가 됩니다. 규칙을 다 외우기 어렵기 때문에 보통은 `===`를 쓰고, `x == null`로 `null`과 `undefined`를 한 번에 거르는 경우에만 `==`를 의도적으로 씁니다. 두 연산자 모두 `NaN`은 자기 자신과도 같지 않다고 보고, 이를 구별해야 하면 `Object.is`를 씁니다.

```js
0 == '0'          // true   0 === '0'          // false
null == undefined // true   null === undefined // false
NaN == NaN        // false  Object.is(NaN, NaN) // true
0 == -0           // true   Object.is(0, -0)    // false
```

(공식 문서) ECMA-262 7.2.14 IsStrictlyEqual은 SameType이 아니면 false를 돌려주고 Number끼리는 Number::equal을 쓴다고 한다. 7.2.13 IsLooselyEqual은 타입이 같으면 IsStrictlyEqual로 넘기고, `null`과 `undefined`는 서로 true, Number와 String이면 String을 숫자로 바꿔 비교하고, Boolean은 숫자로 바꾼 뒤 다시 비교하며, 객체와 원시값이면 ToPrimitive로 객체를 변환해 비교한다고 단계별로 적는다. 6.1.6.1.13 Number::equal은 한쪽이라도 `NaN`이면 false이고 `+0`과 `-0`은 같다고 한다. 20.1.2.15 `Object.is`는 SameValue를 돌려주며, IsStrictlyEqual 절의 Note는 SameValue와 부호 있는 0, `NaN` 처리에서 다르다고 한다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔고, `null == 0`은 `false`, `{} == {}`는 `false`였다. `Symbol.toPrimitive`를 가진 객체를 `== 7`로 비교하면 힌트 `default`로 호출됐다.
(보충) `x == null`을 허용하는 관행은 코딩 스타일 선택이며 표준의 권고가 아니다.
