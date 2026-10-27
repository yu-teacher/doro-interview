---
slug: "rst-07"
topic: "api-rest"
tier: BASIC
difficulty: 1
title: "PUT 이나 DELETE 요청이 성공하면 200 과 204 중 무엇을 돌려주나요?"
keywords: ["본문이 없으면 204", "상태를 설명하는 본문이 있으면 200", "아직 처리 전이면 202", "PUT으로 새로 만들면 201", "204에도 ETag 같은 헤더 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://google.aip.dev/135"]
concepts: [http-status-error]
importance: 2
links: [{to: "web-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
돌려줄 본문이 없으면 204 No Content, 처리 결과를 설명하는 표현을 함께 주려면 200 OK입니다. PUT은 리소스가 없어서 새로 만들었으면 201이고, 이미 있던 리소스를 바꿨다면 200이나 204 중 하나를 반드시 보내야 합니다. DELETE는 이미 삭제했고 알릴 내용이 없으면 204, 상태를 설명하는 본문이 있으면 200, 성공할 것 같지만 아직 처리 전이면 202를 권고합니다. 204도 헤더는 보낼 수 있어서 PUT 뒤 새 `ETag`를 204 응답에 실을 수 있습니다(저장한 내용이 받은 그대로일 때만). Google AIP-135는 없는 리소스를 삭제하면 `NOT_FOUND`(HTTP 404) 오류를 내라고 합니다.

```
PUT    /items/1 (If-Match 포함) -> 204 No Content, etag: "49c15451"
DELETE /items/1                 -> 204 No Content
GET    /items/1                 -> 404 Not Found
```

(공식 문서) RFC 9110 9.3.4는 PUT이 기존 표현을 성공적으로 수정했을 때 200 또는 204를 보내야 한다고 한다. 9.3.5는 DELETE가 성공하면 아직 실행되지 않았지만 성공할 가능성이 높을 때 202, 실행됐고 더 알릴 정보가 없을 때 204, 실행됐고 상태를 설명하는 표현이 있을 때 200을 보내라고 권한다(SHOULD). 15.3.5는 204가 성공했고 보낼 본문이 없다는 뜻이며, 헤더는 요청이 적용된 뒤의 대상 리소스와 선택된 표현을 가리킨다고 하고 PUT에 대한 204에 `ETag`가 있으면 그것이 새 표현의 엔터티 태그라는 예를 든다. 다만 9.3.4는 요청 표현 데이터를 변형 없이 그대로 저장했고 검증자가 새 표현을 반영할 때가 아니면 PUT 성공 응답에 `ETag` 같은 검증자를 보내면 안 된다(MUST NOT)고 한다.
(원저자 자료) Google AIP-135는 삭제 응답 메시지를 `google.protobuf.Empty`로 하되 소프트 삭제라면 리소스 자체를 돌려주고, 삭제가 오래 걸리면 장기 실행 작업을 돌려주라고 한다. 리소스가 없었다면 `NOT_FOUND`(HTTP 404) 오류를 내야 하고(`allow_missing` 이 true 가 아닌 경우), 권한이 없으면 존재 여부와 상관없이 `PERMISSION_DENIED`(HTTP 403)를 내야 한다고 한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 서버에 curl 8.7.1 로 보낸 결과다. 서버가 그렇게 응답하도록 내가 구현했으므로 표준 해석을 증명하는 것은 아니다.
