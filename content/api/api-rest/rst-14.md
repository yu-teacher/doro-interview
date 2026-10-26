---
slug: "rst-14"
topic: "api-rest"
tier: DEEP
difficulty: 2
title: "처리 시간이 오래 걸리는 요청은 HTTP API 로 어떻게 설계하나요? 202 Accepted 는 무엇인가요?"
keywords: ["202 Accepted는 접수만 알림", "상태를 확인할 URI 제공", "클라이언트가 폴링", "Retry-After로 대기 시간 안내", "리소스 상태 필드로 모델링하는 방법"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md"]
concepts: [rest-design, http-status-error]
importance: 2
links: [{to: "rst-06", kind: PREREQ}, {to: "apd-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
요청을 받자마자 끝까지 처리하지 않고 접수만 한 뒤 202 Accepted로 응답하고, 응답에 작업 상태를 볼 수 있는 URI를 알려 줍니다. 202는 처리가 끝나지 않았고 나중에 거부될 수도 있다는 의도적으로 모호한 코드라서, 결과를 알려 주는 상태 모니터를 따로 두어야 합니다. 클라이언트는 그 URI를 폴링하고, 서버는 `Retry-After`로 기다릴 시간을 안내할 수 있습니다. Microsoft 가이드는 작업 상태를 리소스 필드에 두고 일반 동기 프로토콜로 조회하는 방식을 가장 선호하고, 그렇지 못할 때 `Operation-Location` 헤더와 operation 리소스를 쓰는 방식을 소개합니다. 요청 검증 오류는 가능하면 접수 전에 동기로 돌려줍니다.

(공식 문서) RFC 9110 15.3.3은 202를 요청이 처리를 위해 접수됐지만 처리가 끝나지 않았다는 뜻이라 하고, 나중에 실제로 처리될 때 허용되지 않을 수도 있으며 HTTP에는 비동기 작업의 상태 코드를 다시 알릴 방법이 없다고 한다. 의도적으로 확답을 하지 않는 코드이고 응답 표현이 요청의 현재 상태를 설명하고 완료 시점을 추정할 수 있는 상태 모니터를 가리키거나 담아야 한다고 한다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시 문서) 13.1은 작업 상태를 리소스에 담아 표준 동기 프로토콜로 조회하는 방식이 선호되는 모델이라고 한다(예: 리소스의 `state`가 Rebooting에서 Running으로 바뀜). 13.2는 그렇지 않은 단계적 장기 작업에서 가능한 한 많은 검증을 동기로 하고 오류를 먼저 돌려주라고 한다. 13.2.1과 13.2.2는 PUT이나 POST에 대해 202와 `Operation-Location` 헤더를 돌려주는 예를 든다. 13.2.5는 operation 리소스의 GET이 200과 상태(notstarted, running, succeeded, failed 등)를 돌려주고, 13.2.7과 13.2.9는 `Retry-After`로 대기 시간을 알리고 완료 응답이 올 때까지 폴링하는 흐름을 설명한다. `Operation-Location`은 이 가이드의 관례이지 RFC 9110의 헤더가 아니다(RFC 9110 전문에서 해당 이름은 나오지 않는다). RFC 9110 10.2.3은 `Retry-After`를 서버가 후속 요청 전에 기다릴 시간을 알리는 헤더로 정의하며 값은 초 단위 정수나 HTTP 날짜다.
이 질문은 문서 근거만 사용했고 실험하지 않았다.
