---
slug: "fwp-18"
topic: "frontend-web-platform"
tier: TRICKY
difficulty: 3
title: "flex 아이템 안의 긴 텍스트가 줄어들지 않고 컨테이너를 넘치는 이유는 무엇인가요?"
keywords: ["min-width 초기값 auto", "내용 기반 최소 크기", "flex-shrink로도 최소 크기 아래로 안 줄어듦", "min-width 0으로 해결", "스크롤 컨테이너는 최소 크기 0"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/css-flexbox-1/", "https://www.w3.org/TR/css-sizing-3/"]
concepts: [css-layout]
importance: 1
links: [{to: "fwp-07", kind: PREREQ}]
---
**모범 답변 (30~60초)**
플렉스 아이템의 `min-width` 초기값은 `0`이 아니라 `auto`이고, 주축에서 이 값은 내용 기반 최소 크기가 됩니다. 그래서 줄바꿈이 안 되는 긴 단어나 넓은 자식이 있으면 `flex-shrink`가 줄이려 해도 그 최소 크기 아래로는 줄어들지 않고 컨테이너를 넘칩니다. 아이템이 스크롤 컨테이너이면 자동 최소 크기가 0이라서 이 문제가 생기지 않습니다. 그래서 흔한 해결책은 아이템에 `min-width: 0`을 직접 주는 것이고, 세로 방향 플렉스라면 주축이 높이이므로 `min-height`가 대상입니다.

(공식 문서) CSS Flexbox Level 1 4.5절은 `auto`가 `min-width`·`min-height`의 새 초기값이고, 주축의 자동 최소 크기가 계산된 `overflow` 값이 스크롤 불가인 플렉스 아이템에서는 내용 기반 최소 크기로, 스크롤 컨테이너에서는 평소처럼 0으로 사용된다고 한다. 내용 기반 최소 크기는 대체 요소와 아닌 요소에서 다르게 정의된다. 
(보충) 줄바꿈이 안 되는 긴 단어가 원인이 되는 것은 min-content 크기가 모든 소프트 줄바꿈 기회를 취한 크기라는 Sizing 사양의 정의에서, 그리고 `min-width: 0`을 주는 해결책은 `auto`가 아닌 값을 지정하면 자동 최소 크기를 쓰지 않는다는 데서 이끌어낸 일반적인 설명이며 사양이 해결책으로 제시한 문장은 찾지 못했다(Flexbox 사양 전체에서 grep 확인).
(공식 문서) 2절은 플렉스 레이아웃에서 주축 크기가 주축 크기 속성이 아니라 `flex` 속성으로 제어된다고 하고, 9.7절의 플렉스 길이 결정은 각 아이템의 목표 주축 크기를 사용된 최소·최대 크기로 고정하는 단계(Fix min/max violations)를 둔다. 그래서 자동 최소 크기가 내용 기반 값이면 `flex-shrink`로 줄여도 그 값 아래로 내려가지 않는다는 결론은 두 규칙을 합쳐 이끌어낸 것이다. 세로 방향에서 `min-height`가 대상이라는 것은 주축이 높이일 때 같은 정의를 적용한 설명이다.
