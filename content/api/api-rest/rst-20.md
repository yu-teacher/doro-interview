---
slug: "rst-20"
topic: "api-rest"
tier: TRICKY
difficulty: 3
title: "존재하지 않는 리소스에 PATCH 요청이 오면 어떻게 응답해야 하나요?"
keywords: ["패치 문서에 따라 서버가 생성할 수도 있음", "적용할 수 없으면 404", "Microsoft는 upsert 미지원 시 409", "If-Match가 있으면 생성하지 않음", "표준과 가이드라인의 답이 다름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc5789.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/GuidelinesGraph.md"]
concepts: [http-status-error, rest-design]
importance: 1
links: [{to: "rst-13", kind: PREREQ}]
---
**모범 답변 (30~60초)**
표준 RFC 5789는 PATCH 대상이 없을 때 서버가 패치 문서의 종류와 권한에 따라 새 리소스를 만들 수도 있다고 하고, 패치 문서가 존재하지 않는 리소스에는 적용할 수 없는 종류라면 404를 쓸 수 있다고 합니다. 반면 비권장 표시가 붙은 Microsoft 가이드는 호출자가 키를 지정할 수 있는 서비스는 PATCH를 upsert로 지원하라고 권하고, 지원하지 않으면 없는 리소스에 대한 PATCH를 409 Conflict로 처리하라고 합니다. upsert를 지원해도 `If-Match`가 있으면 생성으로 처리하면 안 되고, `If-None-Match: *`가 있으면 수정으로 처리하면 안 됩니다. 이렇게 표준과 가이드라인의 답이 다르므로 한 가지로 단정하지 않고 근거를 대며 설명해야 합니다.

(공식 문서) RFC 5789 2절은 요청 URI가 기존 리소스를 가리키지 않으면 패치 문서 종류(널 리소스를 논리적으로 수정할 수 있는지)와 권한 등에 따라 서버가 새 리소스를 만들 수 있다고 한다. 2.2의 오류 처리에서 리소스 없음은, 클라이언트가 존재하지 않는 리소스에 패치 문서를 적용하려 했는데 선택한 패치 문서가 그런 리소스에는 적용될 수 없을 때 404로 표시할 수 있다고 한다. 구조가 달라 요청을 적용할 수 없는 충돌 상태는 409로 표시할 수 있다고 한다. RFC 5789는 RFC 2616 시절의 명세이고 RFC 9110 에는 PATCH 정의가 없다.
(원저자 자료) Microsoft REST API Guidelines(2026-10-27 확인 시점에 Graph 가이드로 병합 중이며 2024-07-01 제거 예정이라고 적힌 비권장 표시 문서) 7.4.3은 호출자가 생성 시 키 값을 지정할 수 있는 서비스는 upsert를 지원하는 것이 권장(SHOULD)이고, 지원하는 서비스는 PATCH로 생성을 지원해야 한다(MUST)고 한다. upsert에서는 없는 리소스에 대한 PATCH를 생성으로, 있는 리소스에 대한 PATCH를 수정으로 처리하며, `If-Match`가 있으면 삽입으로, `If-None-Match`가 `*`이면 수정으로 처리하면 안 된다고 한다. upsert를 지원하지 않으면 없는 리소스에 대한 PATCH는 409 Conflict여야 한다고 한다. Microsoft Graph 가이드의 Behavior modeling 규칙은 키를 URL에 주는 upsert로 생성하는 PATCH를 추가로 쓰기를 권장한다.
이 질문은 문서 근거만 사용했고 실험하지 않았다.
