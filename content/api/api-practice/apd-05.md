---
slug: "apd-05"
topic: "api-practice"
tier: BASIC
difficulty: 1
title: "OpenAPI 명세는 무엇이고, API 문서화와 코드 생성에는 어떻게 쓰이나요?"
keywords: ["언어 중립 API 설명 문서", "paths와 operation", "components 재사용 스키마", "JSON Schema 기반 스키마", "문서·코드 생성 도구의 입력"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://spec.openapis.org/oas/v3.1.1.html", "https://spec.openapis.org/oas/latest.html"]
concepts: [rest-design]
importance: 2
links: [{to: "apd-13", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
OpenAPI는 HTTP API를 언어와 무관한 형식으로 기술하는 표준 명세입니다. JSON이나 YAML 문서 하나에 `paths` 아래로 경로별 operation, 파라미터, 요청·응답 본문과 상태 코드를 적고, 공통으로 쓰는 스키마·파라미터·응답은 `components`에 모아 `$ref`로 가져다 씁니다. 스키마 객체는 (3.1.1 기준) JSON Schema 2020-12의 상위 집합입니다. 명세는 소스 코드를 보지 않고도 사람과 도구가 서비스의 기능을 파악하게 하는 것이 목적이라고 밝히고, 이 문서로 문서화 도구가 API를 보여주고 코드 생성 도구가 서버와 클라이언트를 만들며 테스트 도구도 쓸 수 있다고 설명합니다.

(공식 문서) OpenAPI Specification 3.1.1의 소개는 이 명세가 프로그래밍 언어에 중립적인 HTTP API 인터페이스 설명 표준이라고 하고, 문서화 도구, 여러 언어의 서버·클라이언트 코드 생성 도구, 테스트 도구 등에 쓸 수 있다고 한다. Components Object는 재사용 객체(스키마, 응답, 파라미터 등)를 담되 밖에서 참조하지 않으면 API에 영향이 없다고 한다. Schema Object는 JSON Schema 2020-12의 상위 집합이다. 최신판인 3.2.1(2026-09)의 소개도 같은 취지다. 이 질문은 3.1.1을 기준으로 읽었다.
(실험하지 않았다) 설치된 OpenAPI 도구가 없어 문서 검증이나 코드 생성은 돌려 보지 않았다.
