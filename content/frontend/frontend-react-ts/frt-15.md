---
slug: "frt-15"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "TypeScript 제네릭은 왜 쓰고, `any`와는 무엇이 다른가요? 제약(`extends`)은 언제 쓰나요?"
keywords: ["타입 변수로 타입 정보 보존", "any는 반환 타입 정보 손실", "타입 인자 추론", "extends로 제약"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.typescriptlang.org/docs/handbook/2/generics.html"]
concepts: [typescript-types]
importance: 2
---
**모범 답변 (30~60초)**
제네릭은 함수가 여러 타입에서 동작하게 하면서 타입 정보를 잃지 않게 하는 도구입니다. 항등 함수를 `any`로 만들면 무엇이든 받지만 무엇이 돌아오는지 정보를 잃습니다. 반면 `function identity<Type>(arg: Type): Type`처럼 타입 변수를 쓰면 들어온 타입이 반환 타입으로 그대로 이어집니다. 호출할 때 `identity<string>("a")`처럼 타입 인자를 직접 줄 수도 있지만 보통은 컴파일러가 인자에서 추론하게 두고, 추론이 안 되는 복잡한 경우에만 명시합니다. 제네릭 값은 어떤 타입이든 될 수 있다고 가정하고 써야 해서, `.length` 같은 걸 쓰려면 `Type extends Lengthwise`처럼 제약을 겁니다.

(공식 문서) TypeScript 핸드북 Generics는 항등 함수를 예로 들어, `any`로 쓰면 어떤 타입이든 받지만 반환 시 인자의 타입 정보를 잃고, 타입 변수를 쓰면 인자와 반환에 같은 타입을 이어서 정보를 잃지 않으며 숫자 전용 버전만큼 정확하다고 한다. 호출 방법으로 타입 인자를 직접 전달하는 방법과 컴파일러가 인자에서 추론하게 하는 방법이 있고 후자가 가장 흔하며, 복잡한 경우 추론에 실패하면 명시해야 한다고 한다. 제네릭 타입 변수를 쓰는 함수 본문에서는 그 인자를 어떤 타입이든 될 수 있는 것처럼 다뤄야 하며, 특정 멤버(`.length`)가 필요하면 그 요구를 `extends`로 표현한 제약으로 걸라고 한다.
