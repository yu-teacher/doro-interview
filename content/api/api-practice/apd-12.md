---
slug: "apd-12"
topic: "api-practice"
tier: DEEP
difficulty: 2
title: "API를 폐기할 때 클라이언트에 미리 어떻게 알리나요? (Deprecation·Sunset 헤더)"
keywords: ["Deprecation 헤더는 폐기 시점", "Sunset 헤더는 중단 예정 시각", "헤더로 동작은 바뀌지 않음", "Sunset은 Deprecation보다 빠를 수 없음", "충분히 공지된 폐기 기간"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9745.html", "https://www.rfc-editor.org/rfc/rfc8594.html", "https://google.aip.dev/185", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/azure/Guidelines.md"]
concepts: [api-versioning]
importance: 1
links: [{to: "apd-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
응답 헤더로 폐기 일정을 알릴 수 있습니다. `Deprecation`은 RFC 9745가 정한 헤더로 그 리소스가 폐기됐거나 폐기될 날짜를 `@1688169599` 같은 Unix 시간 형식으로 담고, `Sunset`은 RFC 8594가 정한 헤더로 리소스가 응답하지 않게 될 것으로 예상되는 시각을 HTTP 날짜 형식으로 담습니다. 둘을 함께 쓸 때 Sunset은 Deprecation보다 이르면 안 됩니다. 이 헤더들은 힌트일 뿐 리소스의 동작을 바꾸지 않으므로, 대체 방법을 안내하는 문서를 `Link` 헤더로 연결하는 것이 좋습니다. Google AIP-185는 이전 버전을 끄기 전에 합리적이고 충분히 공지된 폐기 기간을 두라고 합니다.

(공식 문서) RFC 9745(표준 트랙, 2025-03)는 `Deprecation`이 Structured Field의 Date 항목이고 예로 `Deprecation: @1688169599`를 든다. 폐기는 리소스의 동작을 바꾸지 않고 이 헤더는 힌트라고 하며, `Sunset`을 함께 쓸 때 `Sunset` 시각이 `Deprecation`보다 이르면 안 된다고 한다. 폐기 문서는 `deprecation` 링크 관계로 연결할 수 있다. RFC 8594(Informational)는 `Sunset`이 HTTP-date 하나를 담아 리소스가 응답하지 않게 될 예상 시점을 알리고 그 시각은 미래여야 하며(SHOULD) 클라이언트는 이를 힌트로 다뤄야 한다고 한다. AIP-185는 이전 버전을 끄기 전에 합리적이고 충분히 공지된 폐기 기간을 요구한다. Azure 가이드라인은 별도로 자사 규칙의 `azure-deprecating` 헤더를 쓴다.
(실험 확인) Node 24로 2023-06-30T23:59:59Z를 Unix 초로 바꾸자 `1688169599`로 RFC 9745의 예시값과 같았고, 2024-06-30T23:59:59Z는 HTTP 날짜로 `Sun, 30 Jun 2024 23:59:59 GMT`가 됐다. RFC 9745 예시의 `Sunset`은 `UTC`로 적혀 있어 내가 만든 `GMT` 표기와 글자가 다르다.
