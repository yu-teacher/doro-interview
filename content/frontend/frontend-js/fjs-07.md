---
slug: "fjs-07"
topic: "frontend-js"
tier: BASIC
difficulty: 1
title: "브라우저의 자바스크립트와 Node.js 의 자바스크립트는 무엇이 다른가요?"
keywords: ["언어는 같고 호스트 API 가 다름", "브라우저는 window·DOM", "Node.js 는 process·Buffer·모듈 시스템", "globalThis", "setTimeout 반환값 차이"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://tc39.es/ecma262/", "https://html.spec.whatwg.org/multipage/webappapis.html", "https://nodejs.org/docs/latest/api/globals.html", "https://nodejs.org/docs/latest/api/modules.html", "https://nodejs.org/docs/latest/api/timers.html"]
concepts: [js-event-loop]
importance: 1
---
**모범 답변 (30~60초)**
언어 문법과 내장 객체는 ECMAScript 표준이라 같고, 다른 것은 실행 환경인 호스트가 덧붙이는 API입니다. 브라우저에는 `window`와 DOM 같은 웹 플랫폼 API가 있고, Node.js에는 `window`와 `document`가 없는 대신 `process`, `Buffer`, 모듈 시스템이 있습니다. 전역 객체의 이름도 환경마다 달라서 `globalThis`를 쓰면 공통으로 가리킬 수 있습니다. 타이머도 브라우저의 `setTimeout`은 숫자 id를, Node.js는 `Timeout` 객체를 돌려주는 식으로 갈립니다. `queueMicrotask`나 `structuredClone`처럼 양쪽에 모두 있는 웹 API도 있습니다.

```js
// Node.js v24.16.0 에서 실행
typeof window    // 'undefined'
typeof document  // 'undefined'
typeof process   // 'object'
typeof structuredClone, typeof queueMicrotask  // 'function', 'function'
setTimeout(() => {}, 0).constructor.name       // 'Timeout'
```

(공식 문서) ECMA-262 4.1·4.2는 언어가 호스트 환경을 전제로 하고 브라우저와 서버가 각자 호스트 환경을 제공한다고 설명한다. HTML Living Standard의 Web application APIs 장 8.2는 `Window`와 `WorkerGlobalScope`가 포함하는 `WindowOrWorkerGlobalScope` 인터페이스에 `setTimeout`(반환형 `long`), `queueMicrotask`, `structuredClone`이 정의되어 있다고 적는다.
(공식 문서) Node.js globals 문서는 `global`을 레거시로 표시하며 `globalThis`를 쓰라고 하고, 브라우저에서는 최상위 스코프가 전역 스코프이지만 Node.js에서는 모듈 안의 최상위 `var`가 그 모듈에 머문다고 설명한다. 또 `__dirname`, `__filename`, `exports`, `module`, `require()`는 전역처럼 보여도 CommonJS 모듈 범위의 변수라고 하며, `process`·`Buffer`·`queueMicrotask`·`structuredClone`·`fetch`를 전역 항목으로 문서화한다. Node.js modules 문서는 모듈 코드를 `(function(exports, require, module, __filename, __dirname) {...})`로 감싼다고 설명한다. `setTimeout`은 `Timeout`을 돌려준다고 timers 문서가 적는다.
(실험 확인) Node.js v24.16.0에서 위 블록의 결과가 나왔고 `globalThis === global`이었다. 문서는 v26.12.1 기준이고 실험은 v24.16.0이라 버전 차이가 있다.
