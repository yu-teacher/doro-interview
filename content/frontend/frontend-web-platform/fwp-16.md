---
slug: "fwp-16"
topic: "frontend-web-platform"
tier: TRICKY
difficulty: 3
title: "`z-index: 9999` 를 줬는데도 다른 요소 뒤에 가려지는 이유는 무엇인가요?"
keywords: ["z-index는 같은 쌓임 맥락 안에서만 비교", "쌓임 맥락은 부모 입장에서 원자적", "조상이 새 쌓임 맥락을 만듦", "opacity와 transform도 맥락 생성", "위치 지정 요소에 적용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/CSS2/visuren.html", "https://www.w3.org/TR/css-position-3/", "https://www.w3.org/TR/css-color-4/", "https://www.w3.org/TR/css-transforms-1/", "https://www.w3.org/TR/css-flexbox-1/", "https://www.w3.org/TR/css-grid-1/"]
concepts: [css-layout]
importance: 1
---
**모범 답변 (30~60초)**
`z-index`는 문서 전체에서 한 줄로 비교되는 숫자가 아니라 같은 쌓임 맥락(stacking context) 안에서만 비교됩니다. 쌓임 맥락은 부모 관점에서 원자적이라서 다른 맥락의 박스가 그 사이에 끼어들 수 없습니다. 그래서 `z-index: 9999` 요소의 조상이 `z-index: 1`로 만든 맥락 안에 있다면, `z-index: 2`인 다른 맥락 전체보다 뒤에 그려집니다. `z-index`가 `auto`가 아닌 위치 지정 요소 말고도 `opacity`가 1보다 작거나 `transform`이 `none`이 아닌 요소가 새 맥락을 만들어 뜻밖의 가림이 생깁니다.

(공식 문서) CSS2 9.9는 쌓임 맥락이 서로 포함될 수 있고 부모 쌓임 맥락의 관점에서 원자적이어서 다른 맥락의 박스가 그 박스들 사이에 끼어들 수 없다고 한다. 각 박스는 한 쌓임 맥락에 속하고 스택 레벨은 같은 맥락 안에서의 z축 위치이며, 루트 요소가 루트 맥락을 만들고 `z-index`가 `auto`가 아닌 위치 지정 요소가 새 맥락을 만든다고 한다. `auto`이면 레벨은 0이고 루트가 아니면 새 맥락을 만들지 않는다. CSS Positioned Layout 3 2.2절은 `z-index`가 위치 지정 박스에 적용되고, `auto`일 때도 `fixed`·`sticky` 박스는 맥락을 만든다고 한다.
(공식 문서) 답변의 `9999` 대 `2` 예시는 이 원자성 규칙을 적용한 것이다. CSS Color 4는 `opacity`가 1보다 작은 박스가 자식에 대해 쌓임 맥락을 만든다고 하고, CSS Transforms 1은 `transform`이 `none`이 아닌 값일 때 쌓임 맥락이 만들어진다고 한다. CSS Flexbox 4.3절은 플렉스 아이템이 `position`이 `static`이어도 `z-index`가 `auto`가 아니면 맥락을 만든다고 하며 CSS Grid 6.5절도 같은 규칙을 적는다.
