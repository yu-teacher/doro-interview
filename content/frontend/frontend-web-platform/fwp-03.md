---
slug: "fwp-03"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "CSS 박스 모델을 설명하고, `box-sizing: border-box` 가 무엇을 바꾸나요?"
keywords: ["콘텐츠·패딩·보더·마진", "content-box는 width가 콘텐츠 크기", "border-box는 패딩과 보더 포함", "마진은 크기에 불포함"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/css-box-3/", "https://www.w3.org/TR/css-sizing-3/"]
concepts: [css-layout]
importance: 3
links: [{to: "fwp-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
박스를 만드는 요소는 안쪽부터 콘텐츠, 패딩, 보더, 마진 영역으로 이루어집니다. `box-sizing`의 초기값 `content-box`에서는 `width`와 `height`가 콘텐츠 영역의 크기라서 패딩과 보더가 그 바깥에 더해집니다. `border-box`로 바꾸면 지정한 크기가 패딩과 보더까지 포함한 크기가 되고 남는 공간이 콘텐츠가 됩니다. 마진은 어느 쪽에서도 크기에 들어가지 않습니다. 그래서 `width: 200px`에 패딩 20px, 보더 5px이면 `content-box`는 가로로 250px을 차지하고 `border-box`는 200px을 차지합니다.

(공식 문서) CSS Box Model Level 3 2절은 각 박스가 콘텐츠 영역과 선택적인 패딩·보더·마진 영역으로 이루어진다고 설명한다. CSS Sizing Level 3 3.3절은 `box-sizing`의 초기값이 `content-box`이고, 이 값에서는 크기 속성이 콘텐츠 박스에 적용돼 패딩과 보더가 지정한 너비·높이 바깥에 놓인다고 한다. `border-box`에서는 크기 속성이 보더 박스(패딩·보더 포함, 마진 제외)에 적용되고 콘텐츠 박스는 보더와 패딩을 뺀 값이며 0 아래로 내려가지 않는다고 한다. 같은 절은 `getComputedStyle()`이 노출하는 사용된 값도 보더 박스를 가리킨다고 덧붙인다.
(공식 문서) 250px과 200px은 위 정의를 산술로 적용한 값이다(200+20x2+5x2). 브라우저에서 실행해 측정하지는 않았다.
