---
slug: "frt-20"
topic: "frontend-react-ts"
tier: TRICKY
difficulty: 2
title: "TypeScript에서 유니온 타입은 어떻게 좁히나요? 판별 유니온과 `never`로 하는 완전성 검사는 무엇인가요?"
keywords: ["typeof·in·instanceof 타입 가드", "판별 유니온", "never로 완전성 검사", "typeof null은 object"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.typescriptlang.org/docs/handbook/2/narrowing.html"]
concepts: [typescript-types]
importance: 1
links: [{to: "frt-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
유니온 값은 조건문 검사로 더 구체적인 타입으로 좁혀서 씁니다. `typeof`, `in`, `instanceof`, 참 거짓 검사, 동등 비교, 사용자 정의 타입 술어가 좁히기에 쓰입니다. 함정은 `typeof null`이 `"object"`라서 `typeof x === "object"` 검사만으로는 `null`이 걸러지지 않는다는 점입니다. 모든 멤버에 `kind: "circle"`처럼 리터럴 타입의 공통 속성이 있으면 판별 유니온이 되어 `switch`로 멤버를 골라낼 수 있습니다. 여기서 `default`에 값을 `never` 타입 변수에 대입해 두면, 새 멤버를 추가하고 처리를 빠뜨렸을 때 컴파일 오류로 알려 줍니다.

```js
typeof null       // 'object'
typeof []         // 'object'
Array.isArray([]) // true
```

(공식 문서) TypeScript 핸드북 Narrowing은 `typeof` 검사, 참 거짓(truthiness) 검사, 동등성 검사, `in` 연산자, `instanceof`를 타입 가드로 설명하고, 이들로 선언된 타입보다 구체적인 타입으로 정제하는 과정을 좁히기라고 부른다. `typeof null`이 `"object"`인 것은 역사적 사고라서 `string | string[] | null`에서 `typeof strs === "object"`로 배열을 가려내면 `null`일 수 있다는 오류가 난다고 예를 든다. 사용자 정의 타입 가드는 반환 타입을 `pet is Fish` 같은 타입 술어로 선언한다고 한다. 모든 멤버가 리터럴 타입의 공통 속성을 가지면 판별 유니온이며 `switch`로도 좁혀진다고 한다. `never`는 모든 타입에 대입 가능하지만 어떤 타입도 `never`에 대입할 수 없으므로, `default`에서 `never` 변수에 대입해 모든 경우를 처리했는지 확인하는 완전성 검사를 할 수 있고, 멤버를 추가하고 처리를 빠뜨리면 오류가 난다고 한다.
(실험 확인) Node 24.16.0에서 위 세 식을 실행한 결과가 주석이다. 자바스크립트 런타임의 동작이며 TypeScript 컴파일러 동작은 실행하지 못했고 문서 근거로만 썼다.
