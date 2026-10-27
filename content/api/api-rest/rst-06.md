---
slug: "rst-06"
topic: "api-rest"
tier: BASIC
difficulty: 1
title: "리소스를 생성하는 요청이 성공하면 어떤 상태 코드와 헤더를 돌려주나요?"
keywords: ["201 Created", "Location 헤더에 새 리소스 URI", "생성된 리소스를 설명하는 본문", "PUT으로 새로 만들어도 201", "처리가 끝나지 않았으면 202"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md"]
concepts: [http-protocol, http-status-error]
importance: 3
links: [{to: "rst-07", kind: FOLLOWUP}, {to: "rst-14", kind: FOLLOWUP}, {to: "mvc-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
POST로 서버가 식별자를 정해 새 리소스를 만들었다면 201 Created를 돌려주고, 새 리소스의 URI를 `Location` 헤더에 담는 것이 표준의 권고입니다. 본문에는 생성된 리소스나 생성 결과를 설명하는 표현을 넣어 주면 클라이언트가 바로 쓸 수 있습니다. 클라이언트가 URI를 정해 PUT으로 새로 만들었을 때도 201이고, 이미 있던 리소스를 바꾼 경우에는 200이나 204를 씁니다. 생성 작업이 아직 끝나지 않았다면 201이 아니라 202 Accepted로 접수만 알립니다. 200이 아니라 201을 쓰는 것은 요청으로 새 리소스가 생겼다는 사실을 상태 코드로 알리기 위해서입니다.

```
POST /items  {"qty":2,"name":"a","note":"keep"}
HTTP/1.1 201 Created
location: /items/1
etag: "5a6e8ce7"
```

(공식 문서) RFC 9110 9.3.3은 POST로 하나 이상의 리소스가 만들어지면 원 서버가 201 응답을 보내야 하고(SHOULD), 주된 리소스의 식별자를 담은 `Location` 헤더와 요청의 상태를 설명하면서 새 리소스를 가리키는 표현을 함께 보내라고 한다. 15.3.2는 201이 요청이 이행되어 하나 이상의 새 리소스가 생겼다는 뜻이고, 주된 리소스는 `Location` 헤더나 없으면 대상 URI로 식별된다고 한다. 9.3.4는 PUT이 리소스를 새로 만들면 201을 보내야 하고(MUST) 이미 있던 표현을 수정했으면 200 또는 204를 보내야 한다고 한다. 15.3.3은 202가 처리가 끝나지 않은 채 접수됐다는 뜻이라고 한다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시 문서) 7.4.1은 POST가 서비스가 이름을 정한 리소스를 만들 때 `Location` 헤더로 위치를 알리도록 지원하는 것이 권장(SHOULD)이라고 하고 201 Created와 `Location` 예시를 든다. 생성된 항목의 전체 메타데이터를 응답에 돌려줄 수도 있다고 한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 서버에 curl 8.7.1 로 보낸 결과다. 서버가 201과 `Location`을 내도록 내가 구현한 것이므로 표준을 증명하는 것은 아니고 응답 모양을 확인한 것이다.
