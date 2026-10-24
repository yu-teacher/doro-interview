---
slug: "fwp-04"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "이벤트 버블링과 캡처링은 무엇이고, 어떤 순서로 실행되나요?"
keywords: ["캡처 단계에서 타깃 단계, 버블링 단계 순서", "최상위에서 대상으로 내려감", "capture 옵션으로 단계 선택", "bubbles가 false면 버블링 생략", "stopPropagation으로 전파 중단"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://dom.spec.whatwg.org/"]
concepts: [dom-events, browser-rendering]
importance: 2
links: [{to: "fwp-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
이벤트는 대상 요소에서 끝나지 않고 문서 트리를 따라 전파됩니다. 순서는 최상위에서 대상 쪽으로 내려가는 캡처 단계, 대상 자신의 타깃 단계, 대상에서 조상으로 올라가는 버블링 단계입니다. `addEventListener`의 `capture` 옵션이 `true`인 리스너는 캡처 단계에서, 아니면 버블링 단계에서 호출되고, 대상 요소에서는 어느 쪽이든 호출됩니다. 다만 이벤트가 `bubbles`가 `false`로 만들어졌다면 버블링 단계는 건너뜁니다. `stopPropagation()`을 호출하면 이벤트가 다른 객체로 더 전파되지 않습니다.

(공식 문서) DOM 표준 2.1의 예시는 `span`에서 발생한 이벤트에 `document`의 캡처 리스너와 `body`의 버블링 리스너를 달면, 두 번 모두 `target`은 `span`이고 `currentTarget`은 각각 `document`, `body`이며 `eventPhase`가 캡처에서 버블링으로 바뀐다고 설명한다. `span`에 붙은 리스너였다면 `AT_TARGET`이다. 디스패치 알고리즘은 이벤트 경로를 역순으로 돌며 캡처 단계를 호출하고, 이어서 정순으로 돌며 `bubbles` 속성이 `false`이면 버블링 항목을 건너뛴다. `addEventListener` 옵션 설명은 `capture`가 `true`이면 버블링 단계에서는 호출하지 않고, `false`이면 캡처 단계에서 호출하지 않으며, 어느 쪽이든 `AT_TARGET`에서는 호출한다고 한다.
(공식 문서) 같은 표준에서 `stopPropagation()`은 전파 중단 플래그를 세우고 `stopImmediatePropagation()`은 거기에 즉시 중단 플래그까지 세워, 현재 리스너 이후 같은 객체의 다른 리스너도 호출되지 않게 한다.
