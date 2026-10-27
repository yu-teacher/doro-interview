---
slug: "fwp-07"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "flexbox 와 grid 는 어떻게 다르고, 언제 무엇을 쓰나요?"
keywords: ["flex는 한 축 기준 배치", "grid는 행과 열의 2차원 배치", "주축과 교차축", "fr 단위로 남은 공간 분배", "서로 중첩해서 사용 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/css-flexbox-1/", "https://www.w3.org/TR/css-grid-1/"]
concepts: [css-layout]
importance: 2
links: [{to: "fwp-18", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
플렉스박스는 한 방향의 축을 기준으로 항목을 늘어놓고 그 축 안에서 공간을 나누는 데 초점이 있고, 그리드는 행과 열을 함께 정의해 항목을 2차원 칸에 놓는 레이아웃입니다. 플렉스에서는 항목이 놓이는 방향이 주축이고 수직 방향이 교차축이며, `justify-content`는 주축을, `align-items`는 교차축을 기준으로 정렬합니다. 그리드는 `grid-template-columns: 1fr 2fr`처럼 트랙을 선언하고 남는 공간을 `fr` 비율로 나눕니다. 사양도 둘로 만들 수 있는 레이아웃이 겹치고 서로 중첩해서 쓸 수 있다고 합니다.

(공식 문서) CSS Flexbox Level 1 2절은 `display: flex` 또는 `inline-flex`가 만드는 박스를 플렉스 컨테이너, 그 안의 흐름 자식을 플렉스 아이템이라 부르고, 아이템이 놓이는 기본 축을 주축, 수직 축을 교차축이라 정의한다. `justify-content`는 주축을, `align-items`는 교차축 정렬의 기본값을 정한다. CSS Grid Level 1은 2차원 그리드 레이아웃 시스템이라고 소개하며, 그리드가 2차원 정렬을 강제하고 위에서 아래로 접근하는 반면 플렉스박스는 한 축 안의 공간 분배에 집중한다고 비교하고, 둘을 섞어 쓸 수 있다고 한다.
(공식 문서) `fr`은 비율 단위로, 사양의 예에서 `1fr 2fr`이면 남는 공간을 각각 1/3과 2/3 가져간다.
