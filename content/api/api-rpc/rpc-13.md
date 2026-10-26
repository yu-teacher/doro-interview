---
slug: "rpc-13"
topic: "api-rpc"
tier: DEEP
difficulty: 2
title: "GraphQL은 에러가 나도 HTTP 200을 주는 경우가 많다던데, 에러 처리는 어떻게 하나요?"
keywords: ["data·errors·extensions 키", "부분 응답", "data가 있으면 2xx", "실행 전 오류는 data 없음", "도메인 오류는 errors-as-data"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://graphql.org/learn/response/", "https://graphql.org/learn/serving-over-http/", "https://graphql.org/learn/error-handling/", "https://spec.graphql.org/October2021/", "https://spec.graphql.org/draft/"]
concepts: [graphql, http-status-error]
importance: 2
links: [{to: "rst-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
GraphQL 응답은 `data`, `errors`, `extensions` 세 키로 구성되고, 필드 실행 중 에러가 나면 해당 필드를 null로 두고 `errors` 에 담아 나머지 데이터와 함께 부분 응답을 돌려줍니다. HTTP에는 부분 성공을 뜻하는 상태 코드가 없어서, 공식 학습 자료는 `data` 가 null이 아니면 에러가 섞여 있어도 2xx를 쓰라고 안내합니다. 문법·검증 오류처럼 실행 전에 막힌 요청은 `data` 없이 `errors` 만 가고, 검증 오류는 보통 400입니다. 사용자 이름 중복 같은 예상 가능한 비즈니스 오류는 스키마에 오류 타입으로 담는 방식을, 인프라 장애는 최상위 `errors` 를 쓰라고 권장합니다.

(공식 문서) Response 페이지는 스펙이 허용하는 최상위 키가 `data`, `errors`, `extensions` 세 가지이고, 요청 오류는 실행 전에 발생해 `data` 가 없으며, 필드 오류는 부분 데이터와 `errors` 가 함께 올 수 있다고 한다. Serving over HTTP 페이지는 `data` 가 null이 아니면 오류가 있어도 2xx를 권하고(HTTP에 부분 성공 코드가 아직 없으므로), 검증 오류는 보통 400이며, `application/graphql-response+json` 응답은 유효한 요청이 실행에 실패하면 4xx/5xx로 답한다고 설명한다. 레거시 `application/json` 서버는 2xx를 쓰는 경우가 있다고 한다.
(공식 문서) Error Handling 페이지는 최상위 `errors` 배열을 인프라 장애와 잘못된 GraphQL(문법 오류, 알 수 없는 필드), 인증 필요에, errors-as-data(스키마 타입 안의 오류 목록)를 사용자명 중복 같은 비즈니스 규칙 위반에 쓰라고 권고한다. 스펙 2021년 10월판 6.4.4 절은 필드 오류를 필드가 null을 반환한 것처럼 다루고 `errors` 에 추가하며, 현행 초안은 같은 개념을 실행 오류(execution error)라는 이름으로 부른다(두 판 모두 읽었다).
