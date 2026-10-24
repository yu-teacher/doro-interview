---
slug: "fwp-10"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "script 태그의 `async` 와 `defer` 는 어떻게 다른가요?"
keywords: ["일반 script는 파싱을 차단", "async는 받는 즉시 실행", "defer는 파싱 후 문서 순서대로 실행", "DOMContentLoaded 이전에 실행", "module은 기본 defer 동작"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://html.spec.whatwg.org/multipage/scripting.html", "https://html.spec.whatwg.org/multipage/parsing.html"]
concepts: [browser-rendering]
importance: 2
links: [{to: "fwp-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
속성이 없는 외부 `script`는 내려받아 실행하는 동안 HTML 파싱을 멈춥니다. `async`는 파싱과 병렬로 내려받고 다 받는 즉시 실행하므로 파싱이 끝나기 전에 실행될 수 있고, 여러 개일 때 실행 순서가 정해져 있지 않습니다. `defer`는 병렬로 내려받되 문서 파싱이 끝난 뒤 문서에 나온 순서대로 실행하고, 이 실행은 `DOMContentLoaded` 이벤트가 발생하기 전에 끝납니다. 모듈 스크립트는 `defer`가 없어도 `defer`처럼 동작하고 `async`를 붙이면 `async`처럼 동작합니다. 그래서 DOM이나 실행 순서에 의존하는 코드는 `defer`가 어울립니다.

(공식 문서) HTML 표준 4.12.1은 외부 클래식 스크립트에 `async`가 있으면 파싱과 병렬로 가져와 준비되는 즉시(파싱 완료 전일 수 있음) 평가하고, `async` 없이 `defer`만 있으면 병렬로 가져와 페이지 파싱이 끝났을 때 평가하며, 둘 다 없으면 즉시 가져와 평가하면서 둘이 끝날 때까지 파싱을 막는다고 한다. 모듈 스크립트는 `defer`가 효과가 없고 기본적으로 파싱 완료 시 평가되며 `async`가 있으면 준비되는 즉시 평가된다. 준비 알고리즘은 `async` 스크립트를 '가능한 한 빨리 실행할 스크립트 집합'에, `defer`와 모듈을 '문서 파싱이 끝났을 때 실행할 스크립트 목록'에 넣는다.
(공식 문서) HTML 표준 13.2.7 The end의 파싱 종료 절차는 문서 준비 상태를 `interactive`로 바꾼 뒤, 위 목록의 스크립트를 앞에서부터 하나씩(준비될 때까지 이벤트 루프를 돌려 기다리며) 실행하고, 그다음에 `DOMContentLoaded`를 발생시킨다고 적는다.
(공식 문서) `async` 스크립트끼리 실행 순서가 정해져 있지 않다는 것은 표준이 '집합'에 넣고 준비되는 대로 실행하는 알고리즘에서 이끌어낸 결론이며, 순서 비보장을 직접 명시한 문장은 찾지 못했다.
(보충) 분석 스크립트처럼 독립적인 것은 `async`, 순서가 있는 것은 `defer`로 고르는 것은 표준이 정한 규칙이 아니라 사양의 실행 모델에서 따라 나오는 일반적인 사용 지침이다.
