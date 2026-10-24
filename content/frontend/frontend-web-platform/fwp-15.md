---
slug: "fwp-15"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "스타일이 바뀌면 브라우저는 어느 단계부터 다시 계산하나요? 왜 `transform` 애니메이션이 `left` 보다 가볍다고 하나요?"
keywords: ["스타일 계산, 레이아웃, 페인트, 합성 단계", "레이아웃은 위치와 크기 계산", "변형·불투명도 애니메이션은 레이아웃 건너뜀", "합성 스레드에서 처리 가능", "레이어 과다는 오히려 느려짐"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://developer.chrome.com/docs/chromium/renderingng-architecture", "https://developer.chrome.com/blog/inside-browser-part3", "https://html.spec.whatwg.org/multipage/webappapis.html"]
concepts: [browser-rendering, css-layout]
importance: 2
links: [{to: "fwp-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
렌더링은 스타일 계산, 레이아웃, 페인트, 합성 순서로 진행되고, 바뀐 것이 영향을 주는 단계부터 다시 합니다. 레이아웃이 요소의 위치와 크기를 정하는 단계라서 `left`나 `width`가 바뀌면 레이아웃을 다시 계산하고 그 결과를 다시 그려야 합니다. 반면 Chrome 문서는 `transform`, 불투명도 같은 시각 효과의 애니메이션과 스크롤이 레이아웃과 페인트를 건너뛰고 합성 스레드에서 처리될 수 있다고 설명하고, 그래서 메인 스레드 부담이 적습니다. 다만 레이어를 너무 많이 만들면 오히려 느려질 수 있어서 측정이 필요합니다.

(공식 문서) Chrome의 RenderingNG 아키텍처 문서는 Animate, Style, Layout, Pre-paint, Scroll, Paint, Commit, Layerize, Raster, Activate, Aggregate, Draw 단계를 나열하고, 필요 없는 단계는 건너뛸 수 있다고 한다. 시각 효과(스크롤, transform, clip, filter, opacity, blend)의 애니메이션과 스크롤은 레이아웃·프리페인트·페인트를 건너뛸 수 있고, 그러면 메인 스레드 없이 컴포지터 스레드에서만 실행될 수 있다고 한다. "Inside look at modern web browser" 3부는 레이아웃이 요소의 기하(좌표와 크기)를 찾는 과정이고, 레이어를 지나치게 많이 만들면 작은 부분을 매 프레임 래스터하는 것보다 느려질 수 있으므로 렌더링 성능을 측정해야 한다고 설명한다.
(공식 문서) HTML 표준의 렌더링 갱신 절차는 애니메이션 프레임 콜백을 실행한 뒤 스타일 재계산과 레이아웃을 수행한다고 적는다.
(보충) `left` 변경이 레이아웃을 다시 일으킨다는 것은 레이아웃 단계의 정의(위치와 크기 계산)에서 이끌어낸 설명이고, 브라우저별 최적화나 `will-change`의 효과는 확인하지 못했다.
