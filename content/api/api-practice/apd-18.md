---
slug: "apd-18"
topic: "api-practice"
tier: TRICKY
difficulty: 3
title: "같은 `Idempotency-Key`로 다른 본문이 오거나 첫 요청이 끝나기 전에 재시도가 오면 서버는 어떻게 응답하나요?"
keywords: ["키 누락은 400", "다른 본문 재사용은 422", "처리 중 재시도는 409 충돌", "오류 본문에 문서 링크", "409는 수정 없이 재시도 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/", "https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc9457.html"]
concepts: [idempotency]
importance: 1
links: [{to: "apd-08", kind: PREREQ}, {to: "rmq-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
초안은 세 가지 오류 상황을 구분합니다. 키가 필수인 작업에 헤더가 없으면 400으로 응답합니다. 이미 쓴 키를 다른 본문과 함께 다시 쓰면 422 Unprocessable Content로 응답합니다. 같은 키의 요청이 아직 처리되는 중에 재시도가 오면 409 Conflict로 응답합니다. 오류 본문은 `application/problem+json`으로 쓰거나 `Link` 헤더로 문서를 가리키라고 예시를 듭니다. 클라이언트는 400과 422는 요청을 고쳐서 다시 보내야 하지만 409는 고칠 필요 없이 기다렸다가 다시 시도하면 됩니다. 모두 초안의 SHOULD 권고이고 최종 RFC에서 바뀔 수 있습니다. 이미 끝난 뒤의 재시도는 오류가 아니라 완료된 결과와 일치하는 응답을 주라고 합니다.

(공식 문서) draft-ietf-httpapi-idempotency-key-header-08 2.7절은 키가 없으면 400, 다른 본문에 키를 재사용하면 422, 원래 요청이 처리 중일 때의 재시도에는 409로 응답하라(SHOULD)고 하며, 본문은 RFC 9457의 문제 상세로 쓰거나 `Link` 헤더로 문서를 가리키는 예를 든다. 클라이언트는 409를 제외하고는 요청을 고친 뒤에 재시도해야(MUST) 한다고 한다. 이 초안의 재시도 경우 문구는 아직 논의 중이라고 부록 A가 적는다. RFC 9110은 422를 서버가 내용 형식을 이해하고 문법도 맞지만 지시를 처리하지 못했다는 뜻으로, 409를 대상 리소스의 현재 상태와 충돌해 요청을 완료하지 못했다는 뜻으로 정의한다. RFC 9457은 `application/problem+json`을 문제 상세의 표준 JSON 형식으로 정의한다.
(실험 확인) localhost의 Node 24 연습용 서버에서 키 `k-1`을 다른 본문으로 다시 쓰자 422, 처리 시간 300ms 중에 같은 키로 50ms 뒤 재시도하자 409, 키 없이 보내자 400이 나왔다. 처리를 마친 뒤의 같은 키·본문 재시도에는 저장된 결과가 돌아왔다. 상태 코드는 내가 초안 문구대로 정한 모형이다.
