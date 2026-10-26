---
slug: "apd-08"
topic: "api-practice"
tier: DEEP
difficulty: 2
title: "서버는 `Idempotency-Key` 요청을 어떤 순서로 처리해야 하고, 키와 함께 요청 지문(fingerprint)은 왜 쓰나요?"
keywords: ["처음 보는 키는 정상 처리", "재시도에는 처음과 같은 결과", "요청 지문으로 본문 비교", "키 만료 정책 문서화", "추적 시간 창 최소 5분"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/", "https://google.aip.dev/155", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/azure/Guidelines.md"]
concepts: [idempotency]
importance: 2
links: [{to: "apd-06", kind: PREREQ}, {to: "apd-18", kind: FOLLOWUP}, {to: "dst-22", kind: RELATED}]
---
**모범 답변 (30~60초)**
처음 보는 키라면 요청을 정상 처리하고 키와 결과를 저장합니다. 같은 키와 같은 요청이 이미 끝난 뒤에 다시 오면 초안은 사용자 의도대로 완료된 것과 일치하는 응답을 주라고 하므로, 다시 실행하지 않고 저장해 둔 결과를 돌려주는 식으로 구현합니다. 키만 비교하면 클라이언트 실수로 같은 키에 다른 본문이 와도 구분하지 못하므로, 본문 해시 같은 요청 지문을 키와 함께 저장해 같은 요청인지 확인합니다. IETF 초안은 지문을 선택 사항으로 두고, 키의 수명은 서버가 관리하며 만료 정책을 문서로 공개하라고 합니다. Azure 가이드라인은 반복 가능한 요청을 지원한다면 추적하는 시간 창을 최소 5분으로 요구하고, AIP-155는 시간이 지나 똑같은 응답을 못 주면 현재 상태로 대체해도 된다고 허용합니다.

(공식 문서) IETF 초안(부록 A는 재시도 경우의 문구가 아직 논의 중이라고 적는다) 2.4~2.6절은 요청 지문을 본문 전체나 일부의 체크섬, 필드 값 일치 등으로 만들 수 있다(MAY)고 하고, 처음 온 요청은 정상 처리하고, 이미 완료된 뒤의 재시도에는 사용자 의도대로 완료된 것과 일치하는 응답을 주라(SHOULD)고 한다. 리소스가 키의 생명주기를 관리하고 만료 정책을 문서화해야 한다고 한다. AIP-155는 요청 ID를 주면 멱등성을 보장해야 하고, 중복이면 이전 성공 응답을 돌려주는 것을 권고하며, 시간 범위는 적당히 정해도 된다고 한다. 응답을 그대로 재현할 수 없으면 현재 리소스 상태 응답으로 대체해도 된다고 한다. Azure 가이드라인은 POST를 재시도 가능하게 하려면 OASIS Repeatable Requests 1.0의 `Repeatability-Request-ID`·`Repeatability-First-Sent` 헤더를 지원하라고 권고(SHOULD)하고, 지원할 경우 추적 시간 창은 최소 5분이고(MUST), 미지원 작업은 해당 헤더가 오면 501을 주는 것이 좋다고(should) 한다(OASIS 원문은 읽지 않았다).
(실험 확인) localhost의 Node 24 연습용 서버에서 키와 본문 SHA-256 지문을 메모리 맵에 저장했다. 첫 요청이 100ms 타임아웃 난 뒤 서버가 처리를 마치고 같은 키·본문으로 재시도하자 새로 처리하지 않고 저장된 결과(`chargeNo` 1)를 `replayed: true`로 돌려줬고 결제 건수는 1이었다.
(보충) 키 저장과 실제 업무 처리를 한 트랜잭션으로 묶는 방법이나 장애·재시작 시 처리는 문서에서 읽지 않은 일반 설계 지식이며, 위 실험 서버는 단일 프로세스 메모리 모형이라 그 부분을 다루지 않는다.
