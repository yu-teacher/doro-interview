---
slug: "apd-03"
topic: "api-practice"
tier: BASIC
difficulty: 1
title: "API 버전은 URL 경로, 쿼리 파라미터, 헤더, 미디어 타입 중 어디에 두나요? 가이드라인은 무엇을 권고하나요?"
keywords: ["URL 경로의 메이저 버전", "api-version 쿼리 파라미터", "헤더로 버전 지정", "미디어 타입 방식은 Vary 필요", "가이드라인마다 권고가 다름"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://google.aip.dev/185", "https://google.aip.dev/184", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/azure/Guidelines.md", "https://www.rfc-editor.org/rfc/rfc9110.html"]
concepts: [api-versioning]
importance: 3
links: [{to: "apd-04", kind: FOLLOWUP}, {to: "mvc-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
정답이 하나는 아니고 가이드라인마다 권고가 다릅니다. Google AIP-185는 모든 API가 메이저 버전을 가져야 하며 REST에서는 `v1`처럼 URL 경로 맨 앞에 두라고 합니다. Microsoft REST API Guidelines는 경로에 `v1.0`을 넣거나 `api-version` 쿼리 파라미터를 쓰는 두 방식을 허용하고, 경로 구조가 바뀔 수 있는 서비스는 경로에 넣으라고 합니다. Azure 가이드라인은 날짜 형식의 `api-version` 쿼리를 모든 요청에 필수로 요구하고 경로에 버전을 넣지 말라고 합니다. 헤더나 `Accept` 미디어 타입으로 고르는 방식은 응답이 요청 헤더에 따라 달라지므로, RFC 9110이 선택 헤더를 `Vary`에 나열하라고 권고하는 경우에 해당해 캐시가 섞이지 않게 `Vary`를 붙입니다.

(공식 문서) AIP-185는 메이저 버전을 URI 경로 첫 부분에 넣고 `v1.0` 같은 마이너·패치 번호는 노출하지 말라고 한다. 같은 문서의 인터페이스 기반 버저닝은 `X-Goog-Api-Version` 헤더나 `$apiVersion` 쿼리로 `YYYY-MM-DD` 형식 버전을 보낸다고 하고 AIP-184가 그 형식을 정의한다. Microsoft 가이드라인 12.1은 경로 임베드와 쿼리 파라미터 두 방식을 허용하되 경로 안정성을 보장하지 못하면 경로에 넣어야 한다고 하고, Azure 가이드라인은 `api-version` 쿼리를 필수로, 경로의 버전 번호 세그먼트는 금지로 정한다. RFC 9110 12.5.5는 `Vary`에 나열된 선택 헤더 값이 같을 때만(또는 원 서버가 재사용을 검증했을 때) 캐시가 저장된 응답을 재사용할 수 있고, 선택적 재사용을 원하는 서버는 `Vary`를 붙이는 것이 좋다(SHOULD)고 한다.
(실험 확인) URL만 키로 쓰는 단순 캐시 모형(Node 24)에서 `Vary` 없이 v1 요청 뒤에 v2 요청을 보내면 v1 응답이 나갔고, 키에 `Accept`를 넣으면 v2가 나갔다. 실제 프록시 캐시가 아니라 내가 만든 모형이다.
(보충) `Accept` 미디어 타입(`vnd.` 접두)이나 헤더로 버전을 고르는 방식이 `Vary`가 필요한 경우라는 연결은 일반적인 설명이고, 이 방식 자체도 널리 알려진 방식이다. 읽은 AIP·Microsoft·Azure 문서에서는 이 방식을 권고하는 문장을 찾지 못했다(media type, Accept, vnd 검색).
