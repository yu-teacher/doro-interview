---
slug: "apd-14"
topic: "api-practice"
tier: DEEP
difficulty: 2
title: "API 클라이언트는 어떤 실패에서만 자동으로 재시도해야 하나요?"
keywords: ["일시적 오류만 재시도", "고치기 전엔 실패할 오류는 재시도 금지", "비멱등 요청은 자동 재시도 주의", "Retry-After 시간 준수", "무작위 지수 백오프와 횟수 제한"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://google.aip.dev/194", "https://www.rfc-editor.org/rfc/rfc9110.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://sre.google/sre-book/addressing-cascading-failures/"]
concepts: [resilience, idempotency]
importance: 2
links: [{to: "apd-06", kind: PREREQ}, {to: "dst-19", kind: RELATED}, {to: "scl-20", kind: RELATED}, {to: "web-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
재시도해서 성공할 가능성이 있는 일시적 실패에만 자동으로 재시도합니다. Google AIP-194는 반복 실행해도 의도치 않은 상태 변화가 없는 요청에 대해 `UNAVAILABLE` 같은 일시적 오류를 재시도하라고 하고, 잘못된 인자, 권한 없음, 없는 리소스처럼 고치기 전에는 계속 실패할 오류는 재시도하지 말라고 합니다. RFC 9110은 멱등하지 않은 메서드의 요청을 사실상 멱등함을 알거나 원래 요청이 적용되지 않았음을 알아낼 방법이 없다면 자동 재시도하지 말라고 하므로, POST에는 `Idempotency-Key` 같은 보호 장치가 있어야 안전하게 재시도할 수 있습니다. 429나 503에 `Retry-After`가 오면 그 시간만큼 기다리고, 재시도는 Google SRE 책의 권고처럼 무작위성을 섞은 지수 백오프를 쓰며 요청당 횟수를 제한합니다.

(공식 문서) AIP-194는 반복 실행이 의도치 않은 상태 변화를 일으키지 않는 비트랜잭션 단일 요청은 자동 재시도하고, 상태 변화가 생길 요청은 자동 재시도하지 말라고 하며, 재시도 대상 코드로 `UNAVAILABLE`을 든다. `INVALID_ARGUMENT`, `PERMISSION_DENIED`, `NOT_FOUND`, `FAILED_PRECONDITION` 등은 재시도하지 말라고 하고 `RESOURCE_EXHAUSTED`는 쿼터 소진일 수 있어 보통 재시도하지 않는다고 한다. RFC 9110 9.2.2는 클라이언트가 비멱등 메서드를 자동 재시도하지 않아야 하고(SHOULD NOT), 요청이 사실상 멱등함을 알거나 원래 요청이 적용되지 않았음을 감지할 방법이 있을 때가 예외라고 한다. Microsoft 가이드라인 14.5는 호출자가 `Retry-After`가 지시한 최소 시간을 기다려야(MUST) 한다고 한다. SRE 책의 연쇄 장애 장은 재시도에 항상 무작위 지수 백오프를 쓰고, 요청당 재시도를 제한하며 서버 전체 재시도 예산을 두는 것을 고려하라고 하고(예산은 "고려" 수준의 권고), 영구 오류나 잘못된 요청은 재시도하지 말라고 권고한다.
(보충) POST에 멱등 키 같은 장치를 두는 것이 안전한 재시도의 방법이라는 연결은 RFC 9110의 예외 조건에서 이끌어낸 일반적인 설명이다.
(실험 확인) localhost의 Node 24 연습용 서버(고정 창, 2초에 3회)에서 429와 `Retry-After: 2`를 받은 클라이언트가 2초를 기다려 재시도하자 성공했다. 재시도 분류표 자체를 돌려 보지는 않았다.
