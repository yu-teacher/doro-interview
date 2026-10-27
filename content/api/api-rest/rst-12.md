---
slug: "rst-12"
topic: "api-rest"
tier: DEEP
difficulty: 2
title: "두 클라이언트가 같은 리소스를 동시에 수정하는 문제(lost update)는 ETag 와 If-Match 로 어떻게 막나요?"
keywords: ["ETag는 표현의 검증자", "수정 요청에 If-Match 첨부", "불일치하면 412로 거부", "조건 없는 요청은 428로 요구 가능", "If-None-Match: *로 중복 생성 방지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc6585.html", "https://google.aip.dev/154", "https://www.rfc-editor.org/rfc/rfc5789.html"]
concepts: [http-protocol, optimistic-lock]
importance: 2
links: [{to: "rst-19", kind: FOLLOWUP}, {to: "dbl-04", kind: RELATED}, {to: "jpa-23", kind: RELATED}, {to: "web-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
GET 응답의 `ETag`를 읽어 두었다가 수정 요청에 `If-Match`로 그 값을 보내면, 서버는 현재 `ETag`와 같을 때만 요청을 처리하고 다르면 처리하지 않고 412 Precondition Failed로 알릴 수 있습니다. 그러면 내가 읽은 뒤 다른 클라이언트가 바꾼 내용을 모르고 덮어쓰는 lost update를 막을 수 있고, 클라이언트는 다시 읽어 병합한 뒤 재시도합니다. 서버가 조건 없는 쓰기를 아예 받지 않으려면 428 Precondition Required로 조건부 요청을 요구할 수 있습니다. 리소스가 아직 없을 때만 만들고 싶다면 `If-None-Match: *`를 씁니다. `If-Match` 없이 보낸 PUT은 이런 보호를 받지 못합니다.

```
PUT /items/1 (If-Match 없음)         -> 428 Precondition Required
PUT /items/1 If-Match: "5a6e8ce7"   -> 204, etag: "49c15451"   (클라이언트 A)
PUT /items/1 If-Match: "5a6e8ce7"   -> 412 Precondition Failed (클라이언트 B, 오래된 값)
```

(공식 문서) RFC 9110 13.1.1은 `If-Match`가 주로 상태를 바꾸는 메서드(POST, PUT, DELETE)에서 여러 사용자 에이전트가 동시에 같은 리소스를 다룰 때 우발적 덮어쓰기, 즉 lost update를 막는 데 쓰인다고 한다. 조건이 거짓이면 서버는 메서드를 수행하면 안 되고 412로 알릴 수 있으며(MAY), 변경이 이미 적용된 것으로 보이면 2xx로 응답해도 된다고 한다. 13.1.2는 `If-None-Match: *`가 클라이언트가 리소스가 없다고 믿을 때 PUT이 기존 표현을 덮어쓰지 않게 막는 데 쓰이며 여러 클라이언트가 최초 표현을 만들려 할 때 생기는 lost update의 변형을 막는다고 한다. 15.5.13은 412를 조건 헤더가 거짓으로 평가됐다는 뜻으로 정의한다.
(공식 문서) RFC 6585 3절은 428을 원 서버가 요청이 조건부이기를 요구한다는 뜻이라 하고, 전형적인 용도가 GET 후 수정해 PUT 하는 사이에 제3자가 바꾸는 lost update를 막는 것이라고 한다. RFC 5789 2절은 어떤 패치 형식은 알려진 기준 상태에서 적용해야 하므로 클라이언트가 조건부 요청을 써야 한다고(SHOULD) 하면서, 예로 강한 ETag를 담은 `If-Match`를 든다. RFC 6585 7.1은 428 이 선택적 상태 코드라 클라이언트가 그 사용에 기대할 수 없다고 한다.
(원저자 자료) Google AIP-154는 `etag` 필드가 서버에서 오고, 사용자가 보낸 값이 현재 값과 다르면 `ABORTED`(HTTP 409) 오류를 내야 하며, 값을 안 보내면 허용하는 것이 원칙이지만 강한 일관성이 필요한 서비스는 매번 요구하고 `INVALID_ARGUMENT`로 거절할 수 있다고 한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 서버를 curl 8.7.1 로 호출한 결과다. 조건 평가는 내가 구현한 것이므로 표준 동작을 증명하는 것이 아니라 흐름을 확인한 것이다.
