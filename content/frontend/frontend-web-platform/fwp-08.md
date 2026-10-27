---
slug: "fwp-08"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "이벤트 위임(event delegation)이란 무엇이고, `event.target` 과 `event.currentTarget` 은 어떻게 다른가요?"
keywords: ["조상에 리스너 하나", "버블링을 이용", "target은 실제 이벤트 대상", "currentTarget은 리스너가 붙은 요소", "closest로 대상 요소 찾기", "bubbles false 이벤트는 불가"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://dom.spec.whatwg.org/"]
concepts: [dom-events]
importance: 2
---
**모범 답변 (30~60초)**
이벤트 위임은 자식마다 리스너를 달지 않고 공통 조상에 하나만 달아서, 자식에서 버블링되어 올라온 이벤트를 거기서 처리하는 방식입니다. 리스너 수가 줄고, 나중에 추가된 자식도 따로 등록하지 않아도 처리됩니다. 전파 경로가 이벤트를 보내는 시점에 만들어지기 때문입니다. 리스너 안에서 `event.target`은 이벤트가 보내진 대상(보통 가장 안쪽 요소)이고 `event.currentTarget`은 지금 호출된 리스너가 붙은 요소라서, 보통 `event.target.closest(선택자)`로 실제 관심 요소를 찾습니다. 다만 `bubbles`가 `false`인 이벤트는 이 방식이 안 되고, 중간에서 `stopPropagation()`을 호출하면 조상에 닿지 않습니다.

(공식 문서) DOM 표준 2.1의 예시에서 `target`은 계속 `span`이고 `currentTarget`은 리스너가 붙은 `document`, `body`로 바뀐다. 디스패치 알고리즘은 대상에서 시작해 부모를 따라가며 이벤트 경로에 항목을 추가해 경로를 만들고, 캡처 단계는 모든 경로 항목에서 일어나지만 버블링 단계는 `bubbles`가 `false`이면 건너뛴다. 호출 단계는 전파 중단 플래그가 서 있으면 바로 반환한다. `closest(selectors)`는 자기 자신을 포함한 조상 요소 중 선택자와 맞는 첫 요소를 돌려주고 없으면 `null`이다.
(보충) 이벤트 위임이라는 이름과 리스너 수가 줄어든다는 이점은 DOM 표준에 나오지 않는 일반적인 설명이다(표준에서 delegation 이라는 말은 포커스 위임 등 다른 뜻으로만 나온다). 나중에 DOM에 추가된 자식도 조상의 리스너에 닿는다는 것은 이벤트 경로가 디스패치 시점에 부모를 따라가며 만들어진다는 알고리즘에서 이끌어낸 결론이다.
