---
slug: "frt-14"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "TypeScript가 '구조적 타입 시스템'이라는 건 무슨 뜻인가요?"
keywords: ["멤버 구조로 호환성 판단", "implements 선언 불필요", "명목적 타입과 대비", "객체 리터럴 초과 속성 검사"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.typescriptlang.org/docs/handbook/type-compatibility.html", "https://www.typescriptlang.org/docs/handbook/2/objects.html"]
concepts: [typescript-types]
importance: 2
---
**모범 답변 (30~60초)**
타입의 이름이나 선언 관계가 아니라 멤버, 즉 구조만 보고 호환 여부를 판단한다는 뜻입니다. 기본 규칙은 y가 x에 요구되는 멤버를 최소한 다 가지고 있으면 x 자리에 y를 쓸 수 있다는 것입니다. 핸드북 예시에서 `Pet` 인터페이스에 `name`이 있고 `Dog` 클래스에도 `name`이 있으면, `Dog`가 `Pet`을 구현한다고 선언하지 않았어도 대입됩니다. C#이나 Java 같은 명목적 타입 시스템이라면 오류가 나는 코드입니다. 다만 객체 리터럴을 직접 대입하거나 인자로 넘길 때는 대상 타입에 없는 속성이 있으면 오류가 나는 초과 속성 검사가 따로 적용됩니다.

(공식 문서) TypeScript 핸드북 Type Compatibility는 타입 호환성이 구조적 서브타이핑에 기초하며, 구조적 타입은 멤버만으로 타입을 관계짓는 방식이고 명목적 타입과 대비된다고 한다. 기본 규칙은 y가 x와 최소한 같은 멤버를 가지면 x가 y와 호환된다는 것이고, 예시로 `Pet`과 `Dog` 클래스가 `implements` 없이 대입되는 코드를 보여 주며 C#이나 Java 같은 명목적 언어에서는 오류일 것이라고 한다. 구조적 시스템을 쓴 이유는 JavaScript가 익명 객체와 함수 표현식을 많이 쓰기 때문이라고 설명한다. 또 TypeScript의 타입 시스템은 컴파일 시점에 안전함을 알 수 없는 일부 동작을 허용한다고(건전하지 않다고) 밝힌다. Object Types의 Excess Property Checks 절은 객체 리터럴이 변수에 대입되거나 인자로 넘겨질 때 특별 취급을 받아, 대상 타입에 없는 속성이 있으면 오류가 난다고 한다.
