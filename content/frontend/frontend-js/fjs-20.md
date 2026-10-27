---
slug: "fjs-20"
topic: "frontend-js"
tier: TRICKY
difficulty: 3
title: "ES 모듈(ESM)은 CommonJS 와 무엇이 다른가요? `import` 한 값은 복사본인가요?"
keywords: ["ESM 의 import 는 live binding", "CommonJS 는 exports 객체의 값 복사", "import 한 바인딩은 재할당 불가", "ESM 은 항상 strict, 최상위 this 는 undefined", "같은 모듈은 한 번만 평가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://nodejs.org/docs/latest/api/esm.html", "https://nodejs.org/docs/latest/api/modules.html", "https://html.spec.whatwg.org/multipage/scripting.html"]
concepts: [js-modules, js-scope-closure]
importance: 2
links: [{to: "fjs-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
CommonJS는 `require`로 `module.exports` 객체를 받는 구조라서, `module.exports = { count }`처럼 원시값을 담아 내보내면 그 시점의 값이 복사되어 이후 모듈 안에서 바뀌어도 가져간 쪽은 모릅니다. ESM의 `import`는 복사본이 아니라 내보낸 바인딩을 읽기 전용으로 가리키는 live binding이어서, 모듈 안에서 값이 바뀌면 가져간 쪽에서도 새 값이 보이고 가져온 이름에 재할당하면 `TypeError`입니다. 그 밖에 ESM은 항상 strict 모드이고 최상위 `this`가 `undefined`이며 최상위 `await`를 쓸 수 있고 `require`, `__dirname`이 없습니다. 어느 쪽이든 같은 모듈은 한 번만 실행됩니다.

```js
// counter.mjs
export let count = 0;
export function inc() { count++; }
// a.mjs
import { count, inc } from './counter.mjs';
console.log(count);  // 0
inc();
console.log(count);  // 1   (live binding)
count = 5;           // TypeError: Assignment to constant variable.
```

(공식 문서) ECMA-262 9.1.1.5 Module Environment Records는 일반 가변·불변 바인딩 외에 다른 환경 레코드의 대상 바인딩에 간접 접근하는 불변 import 바인딩을 제공한다고 적고, CreateImportBinding은 불변의 간접 바인딩을 만든다. 간접 바인딩의 값을 읽으면 대상 모듈 환경의 값이 반환된다. Module Environment Record의 GetThisBinding은 `undefined`를 돌려주고, Strict Mode Code 절은 모듈 코드를 항상 strict라고 한다. HostLoadImportedModule은 같은 (referrer, moduleRequest)에 대해 성공했다면 매번 같은 결과를 돌려주도록 요구한다.
(공식 문서) Node.js modules 문서는 CommonJS 모듈이 첫 로드 후 캐시되며 `require.cache`를 건드리지 않는 한 여러 번 `require`해도 모듈 코드가 여러 번 실행되지 않는다고 설명한다. Node.js ESM 문서는 ES 모듈에 `require`, `exports`, `module.exports`, `__filename`, `__dirname`이 없고(대체는 `import.meta.filename` 등), 자체 캐시를 가지며, 모듈 최상위에서 `await`를 쓸 수 있다고 적는다. HTML 표준 script 요소 절은 모듈 스크립트가 `async`가 없으면 문서 파싱이 끝난 뒤 평가되고 `defer`는 모듈 스크립트에 효과가 없다고 설명한다. ECMA-262 16.2.1.6.1.3 Evaluate는 이미 평가된 모듈에 다시 호출되면 캐시된 결과 프로미스를 돌려준다고 적는다. Node.js ESM 문서는 `import`로 CommonJS를 불러오면 `module.exports`가 default export로 제공되고, CommonJS에서는 동적 `import()`로 ES 모듈을 불러올 수 있다고 하며, 현재는 `require()`도 top-level await 없는 동기 ES 모듈은 불러올 수 있다고 적는다.
(실험 확인) Node.js v24.16.0에서 위 `counter.mjs`/`a.mjs`가 주석대로 나왔고(`ns.count`도 1), `import './counter.mjs'`를 세 번, 동적 `import()`를 한 번 더 해도 `counter.mjs evaluated`는 한 번만 찍혔다. ESM 최상위의 `this`는 `undefined`, `typeof require`는 `'undefined'`였다. CommonJS에서 `module.exports = { count, inc }`로 내보낸 원시값 `count`는 `inc()` 호출 뒤에도 0이었다. CommonJS에서 `import()`로 ESM을 불러오는 것과 ESM에서 CommonJS를 `import`하는 것(기본 내보내기로 `module.exports`)은 모두 동작했다.
