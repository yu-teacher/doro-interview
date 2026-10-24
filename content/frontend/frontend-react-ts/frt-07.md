---
slug: "frt-07"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 2
title: "TypeScript의 `any`와 `unknown`은 어떻게 다르고, `noImplicitAny`는 무엇을 막나요?"
keywords: ["any는 타입 검사를 끔", "unknown은 확인 전 사용 불가", "좁힌 뒤 사용", "noImplicitAny"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.typescriptlang.org/docs/handbook/2/everyday-types.html", "https://www.typescriptlang.org/docs/handbook/2/functions.html", "https://www.typescriptlang.org/docs/handbook/2/basic-types.html", "https://www.typescriptlang.org/docs/handbook/2/narrowing.html"]
concepts: [typescript-types]
importance: 2
links: [{to: "frt-15", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`any`는 그 값에 대한 타입 검사를 사실상 끄는 타입이라서 프로퍼티 접근, 호출, 대입처럼 문법상 가능한 건 다 허용합니다. `unknown`도 어떤 값이든 받을 수 있지만 훨씬 안전해서, 타입을 확인하기 전에는 그 값으로 아무것도 할 수 없습니다. 그래서 `JSON.parse` 결과처럼 타입을 모르는 값은 `unknown`으로 두고 `typeof` 같은 검사로 좁힌 뒤 쓰는 쪽이 낫습니다. 타입을 쓰지 않았는데 컴파일러가 추론하지 못하면 보통 `any`로 처리하는데, `noImplicitAny`를 켜면 이런 암시적 `any`를 오류로 만들어 줍니다.

(공식 문서) Everyday Types의 any 절은 any 값은 속성 접근, 호출, 대입 등 문법상 가능한 모든 것을 허용하며 타입 검사를 끈다고 하고, 타입을 쓰지 않고 추론도 안 될 때 컴파일러가 보통 any로 처리하므로 `noImplicitAny`로 암시적 any를 오류로 만들 수 있다고 한다. Functions의 unknown 절은 unknown이 any와 비슷하지만 unknown 값으로는 합법적으로 아무것도 할 수 없어서 더 안전하다고 하고, `JSON.parse` 결과를 `unknown`으로 돌려주는 예를 든다. Basic Types는 any를 쓰면 TypeScript를 쓰는 의미가 흐려지는 경우가 많다고 하며, `noImplicitAny`와 `strictNullChecks`를 알아 둘 가장 큰 두 엄격성 플래그로 꼽는다.
(보충) `unknown` 값을 `typeof` 가드로 좁혀 쓰는 방식은 Functions의 unknown 절과 Narrowing의 typeof 가드 절을 이어서 설명한 일반적 사용법이며, 두 페이지가 이 조합을 직접 서술하지는 않는다.
