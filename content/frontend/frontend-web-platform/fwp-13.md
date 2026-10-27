---
slug: "fwp-13"
topic: "frontend-web-platform"
tier: DEEP
difficulty: 2
title: "반응형 웹에서 미디어 쿼리는 어떻게 동작하고, viewport 메타 태그는 왜 필요한가요?"
keywords: ["미디어 쿼리는 참 또는 거짓", "min-width는 width >= 와 같음", "width는 뷰포트 너비", "viewport 메타로 뷰포트 크기 지정", "device-width 미디어 기능은 지양"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/mediaqueries-4/", "https://www.w3.org/TR/css-viewport-1/"]
concepts: [css-layout]
importance: 1
---
**모범 답변 (30~60초)**
미디어 쿼리는 뷰포트 너비 같은 사용자 에이전트와 기기의 조건이 참인지 거짓인지를 따져서, 참일 때만 `@media` 안의 스타일을 적용하는 장치입니다. `min-width: 600px`는 `width >= 600px`과 같고, 여기서 `width`는 장치가 아니라 뷰포트의 너비입니다. 물리 화면 크기를 뜻하는 `device-width` 계열은 사양이 새로 쓰는 스타일에서 쓰지 말라고 합니다. `viewport` 메타 태그는 모바일 브라우저가 데스크톱 너비(보통 980~1024px)로 레이아웃한 뒤 축소하는 기본 동작을 덮어쓰려고 쓰는데, 이 태그를 정의하는 CSS Viewport 사양은 아직 초안입니다.

(공식 문서) Media Queries Level 4는 미디어 쿼리를 참 또는 거짓인 논리식으로 정의하고, 쿼리 목록은 구성 쿼리 중 하나라도 참이면 참이라고 한다. `width` 미디어 기능은 연속 매체에서 스크롤바를 포함한 뷰포트의 너비를 뜻하고, `min-`·`max-` 접두는 `>=`·`<=` 비교와 같다고 설명한다. 부록 A는 `device-width`·`device-height`·`device-aspect-ratio` 등을 폐기된 기능으로 두고 저자는 쓰면 안 된다(must not)고 하며, 사용자 에이전트는 계속 지원해야 하고, 뷰포트 크기를 물을 때는 `width`·`height`를 써야 한다(should)고 한다.
(공식 문서) CSS Viewport Module Level 1은 W3C 첫 공개 작업 초안(2024-01-25)이며, 사용자 에이전트가 제공한 뷰포트 크기를 덮어쓰는 방법을 도입하고 `viewport` 메타 요소가 인식하는 속성으로 `width`, `height`, `initial-scale`, `minimum-scale`, `maximum-scale` 등을 나열한다. 메타 요소 절에는 아직 '명세 필요' 표시가 남아 있어 내용이 확정되지 않았다. 소개 절은 모바일 브라우저가 대체로 데스크톱 창 크기를 흉내 낸 고정 초기 컨테이닝 블록 너비(보통 980~1024px)로 레이아웃한 뒤 화면에 맞춰 줄인다고 설명하고, 그 때문에 CSS 픽셀이 권장보다 작아져 확대해야 읽을 수 있다고 한다. 따라서 최종 표준이 아니라 초안이라는 점을 밝혀 둔다.
(보충) 실무에서 `width=device-width, initial-scale=1`을 쓰는 관례가 있다. 초안은 `width`, `initial-scale` 속성과 `device-width` 키워드를 인식 대상으로 적을 뿐 이 조합을 권장한다는 문장은 없었고(같은 사이트의 다른 절까지 grep 해 확인), 이 조합은 일반적으로 알려진 관례다.
