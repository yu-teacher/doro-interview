---
slug: "fwp-14"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "시맨틱 HTML 이 왜 중요하고, ARIA 는 언제 쓰나요?"
keywords: ["의미에 맞는 요소 사용", "네이티브 요소의 내장 동작", "ARIA는 접근성 트리만 바꿈", "ARIA 첫 번째 규칙", "ARIA는 동작을 만들어 주지 않음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/using-aria/", "https://www.w3.org/TR/wai-aria-1.2/", "https://www.w3.org/TR/html-aria/", "https://html.spec.whatwg.org/multipage/sections.html"]
importance: 1
concepts: [accessibility]
---
**모범 답변 (30~60초)**
`nav`, `button`, `article` 같은 의미에 맞는 요소를 쓰면 보조 기술에 전달되는 역할 정보가 요소에 내장돼 있고, `button`이라면 키보드 동작도 따로 구현하지 않아도 됩니다. ARIA는 HTML이 그런 의미를 제공하지 못할 때 접근성 트리에 역할과 상태를 덧붙이는 보충 수단이라, 역할을 덮어써도 DOM 자체는 바뀌지 않고 동작도 만들어 주지 않습니다. 그래서 ARIA 사용 규칙의 첫 번째는 필요한 의미와 동작이 내장된 네이티브 요소가 있으면 그걸 쓰라는 것입니다. `div`에 `role=button`을 붙였다면 포커스와 Enter·Space 동작을 스크립트로 직접 구현해야 합니다.

(공식 문서) W3C의 "Using ARIA"는 첫 번째 규칙을 원하는 의미와 동작이 이미 내장된 네이티브 HTML 요소나 속성이 있으면 ARIA 역할을 덧붙이는 대신 그것을 쓰라는 것으로 적고, 두 번째 규칙은 불가피한 경우가 아니면 네이티브 의미를 바꾸지 말라는 것이다. 세 번째 규칙은 모든 상호작용 ARIA 컨트롤을 키보드로 쓸 수 있어야 한다는 것이다. 이 문서는 2026-02-24판으로 중단된 초안(Discontinued Draft)이며 규칙은 참고용으로 남겨 둔다고 밝힌다. 비상호작용 요소를 상호작용 요소로 쓰면 의미는 ARIA로, 동작은 스크립트로 직접 넣어야 하므로 네이티브 `button`을 쓰는 편이 훨씬 낫다고 설명한다.
(공식 문서) WAI-ARIA 1.2는 ARIA가 호스트 언어 의미를 대체하는 것이 아니라 보충하는 것이며, 호스트 언어에 동등한 기능이 있으면 그것을 쓰라고 한다. 또 ARIA 역할이 호스트 언어 의미를 덮어쓸 때 DOM은 바뀌지 않고 접근성 트리만 바뀐다고 설명한다. ARIA in HTML은 요소가 내재한 ARIA 의미를 정의하고, 저자가 그 의미와 충돌하게 ARIA를 쓰면 안 된다(MUST NOT)고 하며, 내재 의미와 같은 값을 다시 지정하는 것은 권장하지 않는다(NOT RECOMMENDED)고 한다. HTML 표준은 `section`을 일반 컨테이너가 아니라 주제별 구획이라 하고, 스타일링용 래퍼에는 `div`를 쓰라고 권장한다.
