---
slug: "rst-13"
topic: "api-rest"
tier: DEEP
difficulty: 2
title: "수정 API 를 PUT 으로 만들면 어떤 호환성 문제가 생기고, 가이드라인들은 부분 수정을 어떻게 권고하나요?"
keywords: ["PUT은 전체 교체 의미", "모르는 필드가 지워질 수 있음", "필드 추가가 하위 호환을 깨기 쉬움", "PATCH와 필드 마스크", "가이드라인마다 권고가 다름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc5789.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/GuidelinesGraph.md", "https://google.aip.dev/134"]
concepts: [rest-design, api-versioning]
importance: 2
links: [{to: "rst-20", kind: FOLLOWUP}, {to: "apd-04", kind: RELATED}, {to: "web-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
PUT은 요청 본문으로 리소스 상태를 통째로 교체하므로, 필드를 모르는 구버전 클라이언트가 읽고 고쳐서 PUT하면 서버에 새로 생긴 필드가 본문에서 빠져 지워질 수 있습니다. Microsoft 가이드는 이 위험 때문에 PUT으로 수정하는 것을 위험하다고 하고, Microsoft Graph 가이드는 수정에 PATCH를 쓰고 PUT은 피하라고 합니다. Google AIP-134도 부분 수정을 지원하는 PATCH와 `update_mask` 필드 마스크를 권하고, 전체 교체만 하는 PUT은 필드를 추가하면 하위 호환이 깨지므로 강하게 말린다고 합니다. 다만 이는 가이드라인의 권고이고, 전체 교체가 의도라면 PUT이 맞습니다.

```
GET /items/2                         -> {"id":2,"qty":2,"name":"a","note":"keep"}
PUT /items/2 {"qty":7,"name":"a"}    -> 204   (note 필드를 모르는 클라이언트)
GET /items/2                         -> {"id":2,"qty":7,"name":"a"}   (note 가 사라짐)
```

(공식 문서) RFC 5789 1절은 PUT이 완전한 새 본문으로 리소스를 덮어쓰도록 이미 정의되어 있어 부분 변경에 재사용할 수 없고, 그래서 PATCH가 필요하다고 설명한다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시 문서) 7.4.3은 PUT이 내용의 완전한 교체로 정의되어 있어 클라이언트가 PUT으로 데이터를 수정하는 것이 위험하고, 속성을 모르는 클라이언트는 PUT에 그 속성을 싣지 않아 의도치 않게 삭제될 수 있다고 한다. 서비스가 PUT으로 수정을 지원한다면 교체 의미를 따라 보내지 않은 서버 속성도 삭제해야 한다고 한다. Microsoft Graph 가이드의 Behavior modeling 규칙은 수정에 PATCH를 쓰고 갱신에 PUT을 쓰지 말라고 한다(MUST와 SHOULD NOT).
(원저자 자료) Google AIP-134는 업데이트 메서드가 부분 갱신을 지원하는 것이 원칙이고 HTTP 동사도 PATCH여야 한다고(should) 하며, 전체 교체만 지원하는 PUT은 필드를 추가하는 것이 하위 호환을 깨므로 강하게 말린다고 한다. `update_mask`를 생략하면 값이 채워진 필드 전체를 갱신하는 것으로 보고, 빈 마스크는 아무것도 바꾸지 않는 요청으로 보며, 특수 값 `*`는 전체 교체를 뜻한다고 한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 서버를 curl 8.7.1 로 호출한 결과다. 서버가 PUT을 교체 의미로 구현했기 때문에 필드가 사라진 것이고, 응답의 디버그용 필드는 뺐다.
