---
slug: "frt-06"
topic: "frontend-react-ts"
tier: BASIC
difficulty: 2
title: "TypeScript에서 `interface`와 `type` 별칭은 어떻게 다른가요?"
keywords: ["둘 다 객체 형태 표현", "interface는 선언 병합", "type은 유니온·원시 타입에도 이름", "extends와 교차 타입"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.typescriptlang.org/docs/handbook/2/everyday-types.html"]
concepts: [typescript-types]
importance: 2
links: [{to: "frt-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
객체의 모양을 표현할 때는 둘이 거의 같고, 많은 경우 자유롭게 골라 써도 됩니다. 차이는 몇 가지입니다. `interface`는 같은 이름으로 다시 선언해 속성을 추가하는 선언 병합이 되지만 `type`은 한 번 만들면 다시 열 수 없습니다. 반대로 `type`은 유니온처럼 객체 형태가 아닌 타입에도 이름을 붙일 수 있고, `interface`는 객체 형태만 선언합니다. 확장은 `interface`가 `extends`를 쓰고 `type`은 교차 타입 `&`를 씁니다. 핸드북은 `interface`로 시작하고 `type`의 기능이 필요할 때 바꾸라는 기준을 하나의 방법으로 제시하며, `extends`가 교차 타입보다 컴파일러에 효율적인 경우가 많다고 설명합니다.

(공식 문서) TypeScript 핸드북 Everyday Types의 Type Aliases와 Interfaces 절은 두 선언이 매우 비슷해서 많은 경우 자유롭게 고를 수 있다고 하고, 결정적 차이는 type은 새 속성을 더하기 위해 다시 열 수 없지만 interface는 항상 확장할 수 있다는 것이라고 한다. 예시로 interface의 `extends`, type의 교차 타입, 기존 interface에 필드를 추가하는 선언 병합을 보여 준다. 차이 목록에서 type은 선언 병합에 참여할 수 없고, interface는 객체의 형태만 선언할 뿐 원시 타입의 이름을 바꿀 수 없다고 한다. 또 interface와 `extends`가 교차 타입을 쓴 type보다 컴파일러에 더 효율적일 때가 많다고 한다. 선택 기준은 대체로 취향이지만 휴리스틱이 필요하면 type의 기능이 필요해질 때까지는 interface를 쓰라고 제안한다.
