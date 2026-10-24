---
slug: "fwp-11"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "CSS `position` 의 `static`, `relative`, `absolute`, `fixed`, `sticky` 는 각각 무엇이 다르고, `absolute` 의 기준은 무엇인가요?"
keywords: ["relative는 원래 자리에서 시각적 이동", "absolute는 흐름에서 제거", "가장 가까운 위치 지정 조상 기준", "fixed는 뷰포트 기준", "sticky는 스크롤 컨테이너 안에서 고정"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/css-position-3/", "https://www.w3.org/TR/css-transforms-1/"]
concepts: [css-layout]
importance: 1
---
**모범 답변 (30~60초)**
`static`은 기본값으로 일반 흐름대로 놓이고 `top`·`left` 같은 오프셋이 적용되지 않습니다. `relative`는 일반 흐름 자리에 놓은 뒤 거기서 시각적으로만 옮기고 자손이 아닌 다른 박스의 배치에는 영향이 없습니다. `absolute`는 흐름에서 빠져 형제의 크기와 위치에 영향을 주지 않으며, 가장 가까운 위치 지정 조상(`static`이 아닌 조상)의 패딩 영역을 기준으로 놓이고 그런 조상이 없으면 초기 컨테이닝 블록이 기준입니다. `fixed`는 보통 뷰포트를 기준으로 고정되고, `sticky`는 `relative`처럼 놓이다가 스크롤 컨테이너 안에서 보이는 영역에 머물도록 오프셋이 조정됩니다.

(공식 문서) CSS Positioned Layout Level 3 2절은 `static`이 아닌 값이 박스를 위치 지정 박스로 만들고 자손에 대한 절대 위치 컨테이닝 블록을 만든다고 한다. `relative`는 정적 위치에 놓은 뒤 오프셋하며 순수하게 시각적 효과이고(별도 규정이 없으면 자손 아닌 박스의 크기·위치에 영향이 없고 조상의 스크롤 가능 영역만 늘 수 있다), `absolute`는 흐름에서 제거돼 형제와 조상의 크기·위치에 영향이 없고 절대 위치 컨테이닝 블록과 인셋 속성만을 기준으로 놓인다고 한다. `fixed`는 `absolute`와 같지만 고정 위치 컨테이닝 블록(연속 매체에서는 보통 뷰포트)을 기준으로 하고, `sticky`는 `relative`와 같되 가장 가까운 스크롤 컨테이너의 스크롤포트를 기준으로 오프셋이 자동 조정된다.
(공식 문서) 2.1절에 따르면 `absolute`의 컨테이닝 블록은 절대 위치 컨테이닝 블록을 만드는 가장 가까운 조상 박스이고, 인라인이 아니면 그 조상의 패딩 가장자리로 만들어지며, 없으면 초기 컨테이닝 블록이다. 같은 절의 노트는 `position`뿐 아니라 `transform`, `will-change`, `contain` 같은 속성도 조상이 이런 컨테이닝 블록을 만들게 할 수 있다고 하고, `transform`은 CSS Transforms 사양이 `none`이 아닌 값에서 모든 자손의 컨테이닝 블록(고정 위치 자손 포함)을 만든다고 정한다.
