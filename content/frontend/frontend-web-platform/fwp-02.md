---
slug: "fwp-02"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "DOM 트리는 무엇이고, CSS 는 어느 단계에서 요소에 적용되나요?"
keywords: ["문서를 노드 트리로 표현", "DOM은 자바스크립트가 조작하는 API", "캐스케이드로 계산된 스타일 결정", "display none은 레이아웃 트리에서 제외"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://dom.spec.whatwg.org/", "https://www.w3.org/TR/cssom-1/", "https://www.w3.org/TR/css-cascade-4/", "https://developer.chrome.com/blog/inside-browser-part3"]
concepts: [browser-rendering]
importance: 2
links: [{to: "fwp-15", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
DOM은 HTML 문서를 노드 트리로 표현한 것이고, 동시에 자바스크립트가 문서를 읽고 바꾸는 API입니다. 브라우저는 HTML을 파싱해서 이 트리를 만든 다음, CSS 선택자와 캐스케이드 규칙으로 각 요소에 적용될 선언을 정해 요소별 계산된 스타일을 구합니다. 이 값은 HTML 마크업을 바꾸는 게 아니라 스타일 계산 단계의 결과입니다. 스타일 시트 자체를 스크립트로 다루는 API는 따로 CSSOM이라는 이름으로 표준화돼 있습니다. 이어지는 레이아웃 단계의 트리에는 `display: none` 요소가 빠지고, 반대로 DOM에 없는 `::before` 같은 의사 요소가 들어갑니다.

(공식 문서) DOM 표준 4.1은 원래 의미의 DOM을 문서에 접근하고 조작하는 API라고 하며, 각 문서는 노드 트리로 표현된다고 한다. CSSOM 사양은 스크립트가 스타일 관련 상태에 접근하고 조작하게 하는 핵심 기능을 정의하며 CSS 스타일 시트를 `CSSStyleSheet` 객체로 표현한다고 한다. CSS Cascade 6.1은 캐스케이드가 출처와 중요도 등의 기준으로 선언을 정렬하며, 그 출력이 요소·속성별로 정렬된 선언 목록이라고 한다.
(공식 문서) Chrome의 "Inside look at modern web browser" 3부는 메인 스레드가 CSS를 파싱해 DOM 노드마다 계산된 스타일을 정하고, 레이아웃 트리는 보이는 것과 관련된 정보만 담는다고 설명한다. `display: none`은 레이아웃 트리에 들어가지 않고 `visibility: hidden`은 들어가며, `p::before`의 내용은 DOM에 없어도 레이아웃 트리에 들어간다고 한다. 이 글은 같은 역할의 구조를 레이아웃 트리라 부르며, 이 구현 설명은 Chrome 기준이다.
