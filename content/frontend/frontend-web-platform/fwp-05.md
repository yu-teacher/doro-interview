---
slug: "fwp-05"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "쿠키, localStorage, sessionStorage 는 어떻게 다른가요?"
keywords: ["쿠키는 요청마다 서버로 전송", "localStorage는 세션을 넘어 유지", "sessionStorage는 창 단위", "출처 단위로 분리", "웹 스토리지는 문자열만 저장"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://html.spec.whatwg.org/multipage/webstorage.html", "https://www.rfc-editor.org/rfc/rfc6265.html"]
concepts: [cookie]
importance: 3
links: [{to: "fwp-12", kind: FOLLOWUP}, {to: "web-05", kind: RELATED}, {to: "vul-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
쿠키는 서버가 `Set-Cookie`로 심으면 브라우저가 조건에 맞는 요청마다 `Cookie` 헤더로 자동 전송하므로 서버와 상태를 주고받는 데 쓰고, 개수와 크기에 한도가 있어 큰 데이터에는 맞지 않습니다. `localStorage`는 같은 출처의 여러 창이 공유하고 현재 세션이 끝난 뒤에도 남는 클라이언트 쪽 저장소라 서버로 자동 전송되지 않습니다. `sessionStorage`도 전송되지 않지만 같은 출처여도 창마다 따로 갖고 그 세션 동안만 유지됩니다. 웹 스토리지는 문자열 키와 값만 저장하는 스크립트용 API이고, 쿠키는 `HttpOnly`로 스크립트 접근을 막을 수 있다는 점도 다릅니다.

(공식 문서) HTML 표준 12.1은 두 스토리지가 세션 쿠키와 비슷한 이름-값 저장 방식이라 하면서, 쿠키는 한 창의 단일 거래 상황(두 창에서 항공권을 사는 예)과 수 메가바이트 데이터 저장에 맞지 않고 매 요청마다 전송된다고 설명한다. `sessionStorage`는 해당 창에서 연 같은 사이트의 페이지가 접근하고 창마다 따로 복사본을 갖는다. `localStorage`는 여러 창에 걸치고 현재 세션 이후에도 남는다. 스토리지 이벤트를 받을 다른 `Storage` 객체를 고르는 알고리즘은 같은 출처이고, `session` 타입이면 같은 최상위 탐색 대상(traversable)에 속한 것만 고르며, `sessionStorage` 게터는 창의 출처 기준의 세션 저장 영역을 돌려준다. `Storage`의 `getItem`·`setItem`은 `DOMString`을 받는다.
(공식 문서) RFC 6265(후속 개정 초안이 진행 중이라 수치는 달라질 수 있다) 6.1은 사용자 에이전트가 쿠키당 4096바이트, 도메인당 50개, 전체 3000개 이상을 지원해야 한다(SHOULD)고 하고, 4.1.2.6은 `HttpOnly`가 스크립트 같은 비 HTTP API에 쿠키를 노출하지 않게 한다고 한다.
