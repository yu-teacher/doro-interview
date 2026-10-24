---
slug: "frt-19"
topic: "frontend-react-ts"
tier: TRICKY
difficulty: 3
title: "tsconfig의 `strict`는 무엇을 켜나요? `strict`를 켜면 `as` 타입 단언도 런타임에 안전해지나요?"
keywords: ["엄격 모드 계열 옵션 일괄 활성화", "strictNullChecks", "타입은 컴파일 때 지워짐", "단언은 런타임 검사 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.typescriptlang.org/tsconfig/", "https://www.typescriptlang.org/docs/handbook/2/basic-types.html", "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html", "https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html"]
concepts: [typescript-types]
importance: 1
links: [{to: "frt-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
`strict`는 `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes` 같은 엄격 모드 계열 옵션을 한꺼번에 켜는 스위치이고, 개별 옵션은 따로 끌 수 있습니다. 이후 버전이 이 플래그 아래 검사를 더 추가할 수 있어 업그레이드하면 새 오류가 생길 수 있고, TypeScript 6.0부터는 기본값이 true입니다. 핸드북은 새 코드베이스라면 가능하면 켜라고 권합니다. 하지만 `strict`가 런타임을 검증해 주지는 않습니다. 타입 표기와 `as` 단언은 컴파일할 때 지워지고 런타임 검사가 없어서, 단언이 틀려도 예외가 나지 않습니다. `!`도 값이 null이 아니라고 컴파일러에게 주장할 뿐입니다.

(공식 문서) TSConfig 레퍼런스의 strict 항목은 이 플래그가 더 강한 정확성 보장을 주는 넓은 범위의 검사를 켜고, strict 계열 옵션을 모두 켜는 것과 같으며 개별로 끌 수 있다고 한다. 관련 옵션으로 `alwaysStrict`, `strictNullChecks`, `strictBindCallApply`, `strictBuiltinIteratorReturn`, `strictFunctionTypes`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `useUnknownInCatchVariables`를 나열하고, 이후 버전이 이 플래그 아래 더 엄격한 검사를 도입해 업그레이드로 새 오류가 생길 수 있다고 한다. TypeScript 6.0 릴리스 노트는 `strict`가 이제 기본으로 true이고, 이전 기본값 false에 의존하던 프로젝트는 `"strict": false`를 명시해야 한다고 한다(버전 의존: 6.0 미만은 이 문서로 기본값을 단정하지 않는다). 핸드북 Basic Types는 엄격성 설정이 검사를 켜고 끄는 스위치가 아니라 다이얼에 가깝다고 하고, 새 코드베이스에서는 가능하면 항상 켜라고 권한다(핸드북의 권고). 타입 표기는 컴파일 때 지워지고 런타임 동작을 바꾸지 않는다고 한다. Everyday Types는 타입 단언도 컴파일 때 제거되어 런타임 검사가 없고 틀려도 예외나 null이 생기지 않으며, 후위 `!`는 사실상 값이 null이나 undefined가 아니라는 단언이고 런타임 동작을 바꾸지 않는다고 한다.
