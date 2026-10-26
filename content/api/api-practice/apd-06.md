---
slug: "apd-06"
topic: "api-practice"
tier: BASIC
difficulty: 2
title: "`Idempotency-Key` 헤더는 무엇이고 표준으로 확정된 헤더인가요?"
keywords: ["POST·PATCH 재시도를 안전하게", "클라이언트가 만든 고유 키", "UUID 같은 무작위 값", "IETF 인터넷 초안은 미확정", "서버가 키 정책을 문서화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/", "https://google.aip.dev/155"]
concepts: [idempotency]
importance: 3
links: [{to: "apd-08", kind: FOLLOWUP}, {to: "apd-18", kind: FOLLOWUP}, {to: "dst-07", kind: RELATED}, {to: "web-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
`Idempotency-Key`는 POST나 PATCH처럼 원래 멱등하지 않은 요청을 재시도해도 안전하게 만들려고 클라이언트가 붙이는 요청 헤더입니다. 클라이언트가 요청마다 고유한 값을 만들어 보내면 서버가 같은 키의 재시도를 알아보고 한 번만 처리합니다. 초안은 키로 UUID 같은 무작위 값을 권하고, 같은 키를 다른 본문에 다시 쓰면 안 된다고 합니다. 다만 서버가 지원한다는 보장은 없습니다. 또 이 헤더는 아직 RFC가 아니라 IETF HTTPAPI 워킹그룹의 인터넷 초안이고, 인터넷 초안은 작업 중인 문서라서 내용이 바뀔 수 있습니다. 서버는 멱등성 관련 명세를 공개해야 하고, 만료 정책이 있다면 거기에 포함해야 합니다.

(공식 문서) 이 질문은 draft-ietf-httpapi-idempotency-key-header-08(2026-10, 2027-04-25 만료 예정)을 읽었다. 초안은 이 헤더가 POST·PATCH 같은 비멱등 메서드를 내결함성 있게 만든다고 하고, 값은 Structured Field의 String이며 키는 유일해야 하고 다른 본문과 재사용하면 안 되고(MUST NOT) UUID 같은 무작위 식별자를 권장한다고 한다. 리소스는 멱등성 관련 명세를 공개해야 하고(MUST) 해당하면 만료 정책을 포함해야 한다고 한다. 클라이언트는 키를 보내도 되지만(MAY) 사전 지식 없이는 서버가 따라 줄 것이라고 가정할 수 없다고 한다. 초안 스스로 인터넷 초안은 작업 중인 문서로만 인용해야 한다고 밝힌다. AIP-155는 비슷한 목적의 `request_id` 필드를 두며 UUID를 권장하고, 같은 ID의 중복 요청에는 이전 성공 응답을 돌려주라고 한다.
(실험 확인) localhost의 Node 24 연습용 서버에서 키 없이 보낸 POST는 100ms 타임아웃 뒤 재시도하자 결제가 2건 처리됐고, 같은 흐름에 `Idempotency-Key`를 붙이자 1건만 처리되고 재시도에는 저장된 결과가 돌아왔다. 헤더 동작은 내가 초안을 읽고 만든 단일 프로세스 모형이다.
