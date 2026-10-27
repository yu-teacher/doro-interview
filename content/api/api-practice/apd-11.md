---
slug: "apd-11"
topic: "api-practice"
tier: DEEP
difficulty: 2
title: "처리가 오래 걸리는 요청은 어떻게 비동기로 설계하나요? (202 Accepted와 상태 조회)"
keywords: ["202 Accepted로 즉시 응답", "상태 조회용 URL 안내", "Retry-After로 폴링 간격 안내", "Running·Succeeded·Failed 상태", "완료 뒤에도 일정 기간 보관"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/azure/Guidelines.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://google.aip.dev/151"]
concepts: [rest-design, http-status-error]
importance: 2
links: [{to: "rst-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
요청을 받아 검증만 마친 뒤 202 Accepted로 바로 응답하고, 작업 상태를 조회할 수 있는 URL을 함께 줍니다. 202는 요청이 처리를 위해 받아들여졌을 뿐 아직 끝나지 않았다는 뜻이고, RFC 9110은 응답 내용이 현재 상태를 설명하고 상태를 알려 주는 모니터를 가리키거나 담는 것이 좋다고 합니다. 클라이언트는 그 URL을 폴링하다가 상태가 성공이나 실패로 끝나면 결과를 받습니다. Azure 가이드라인은 작업이 아직 끝나지 않았을 때 상태 조회 응답에 `Retry-After`로 다음 확인까지의 대기 시간을 넣고, 작업이 끝난 뒤에도 최소 24시간은 상태 리소스를 보관하라고 합니다. Google AIP-151은 `Operation` 객체를 돌려주고 `done`과 오류로 완료를 표현합니다.

(공식 문서) RFC 9110 15.3.3은 202가 요청이 처리를 위해 수락됐으나 처리가 끝나지 않았다는 뜻이며 의도적으로 확답하지 않는 응답이고, 표현은 현재 상태를 설명하고 상태 모니터를 가리키거나 담는 것이 바람직하다(ought to)고 한다. Azure 가이드라인은 상태 모니터 URL을 `Operation-Location` 헤더로 주고, 상태 값을 NotStarted·Running·Succeeded·Failed·Canceled로 두며, 99번째 백분위 응답이 1초를 넘으면 장기 실행 작업으로 구현하라고 한다. 완료 후 최소 24시간 보관도 같은 문서에 있다. 폐기 표시가 붙은 Microsoft 가이드라인은 `Location` 헤더와 `Retry-After`를 쓰는 폴링 흐름을 적는다. AIP-151은 오래 걸리는 메서드가 `google.longrunning.Operation`을 반환하라고 하고 기준을 경험칙으로 10초라고 하며, 완료된 Operation 보존은 30일 정도를 경험칙으로 든다.
(실험 확인) localhost의 Node 24 연습용 서버에서 POST가 202, `Location: /operations/j1`, `Retry-After: 1`을 돌려줬고, 1초 간격 폴링 두 번째에 `Succeeded`와 결과가 왔다. 상태 값과 시간은 내가 정한 모형이다.
