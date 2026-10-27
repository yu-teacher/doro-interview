---
slug: "rst-05"
topic: "api-rest"
tier: DEEP
difficulty: 2
title: "주문 취소처럼 리소스로 표현하기 어려운 동작은 어떻게 API 로 설계하나요? URI 에 동사를 써도 되나요?"
keywords: ["상태 변경으로 먼저 모델링", "표준 메서드로 안 맞을 때만 커스텀 메서드", "커스텀 메서드는 보통 POST", "부작용 있는 동작은 GET 금지", "표준 메서드를 억지로 비틀지 않기"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://google.aip.dev/121", "https://google.aip.dev/136", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/GuidelinesGraph.md", "https://www.rfc-editor.org/rfc/rfc9110.html"]
concepts: [rest-design]
importance: 2
links: [{to: "web-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
먼저 그 동작을 리소스의 상태 변경이나 새 리소스 생성으로 바꿀 수 있는지 봅니다. 예를 들어 주문 취소는 `PATCH /orders/7`로 상태를 바꾸거나 취소 요청이라는 하위 리소스를 만드는 식으로 표현할 수 있습니다. 그래도 표준 메서드로 깔끔하게 맞지 않을 때만 동사를 드러내는 커스텀 메서드를 씁니다. Google AIP-136은 이런 동작에 HTTP POST와 URI의 콜론 뒤 동사(예: `:archive`)를 쓰라고 하면서, 표준 메서드를 억지로 비틀어 쓰지는 말라고 합니다. 부작용이 있는 동작은 GET으로 만들면 안 되고 POST를 씁니다. Microsoft Graph 가이드도 표준 HTTP 메서드 기반 리소스 설계를 우선합니다.

(원저자 자료) Google AIP-136은 커스텀 메서드를 표준 메서드로 쉽게 표현할 수 없는 기능에만 쓰고, 표준 메서드가 어울리지 않는 동작을 억지로 맞추지는 말라고 한다. HTTP 메서드는 GET 또는 POST이고, 데이터를 읽는 경우는 GET, 부작용이 있거나 리소스를 바꾸면 POST를 써야 한다고 한다. URI에는 콜론과 커스텀 동사를 붙이는 형태(예: `/v1/{name=publishers/*/books/*}:archive`)를 쓴다. AIP-121은 커스텀 메서드가 새 HTTP 동사를 정의하는 것이 아니라 기존 동사(보통 POST)를 쓰고 URI에 커스텀 동사를 정의하는 것이라고 설명한다.
(원저자 자료) Microsoft Graph REST API Guidelines의 Behavior modeling 절은 가능하면 operation 리소스(함수와 액션)보다 표준 HTTP 메서드를 쓰는 리소스 기반 설계를 쓰라고 한다.
(공식 문서) RFC 9110 9.3.3은 POST를 대상 리소스가 본문을 자기 고유의 의미에 따라 처리하게 하는 메서드로 정의한다.
(보충) 주문 취소를 상태 필드 변경이나 하위 리소스 생성(예: `POST /orders/7/cancellation`)으로 모델링하는 방법은 가이드라인 문서의 예가 아니라 일반적인 설계 방식이다. 이 질문은 설계 설명이라 실험하지 않았다.
