---
slug: "apd-13"
topic: "api-practice"
tier: DEEP
difficulty: 2
title: "OpenAPI에서 인증 방식은 어떻게 표기하나요? (securitySchemes와 security)"
keywords: ["components의 securitySchemes 정의", "apiKey·http·oauth2 같은 type", "security로 최상위나 operation에 적용", "목록 항목은 OR, 한 항목 안은 AND", "빈 객체는 익명 접근 허용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://spec.openapis.org/oas/v3.1.1.html", "https://spec.openapis.org/oas/latest.html"]
concepts: [authn-authz]
importance: 1
links: [{to: "apd-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
두 단계로 표기합니다. 먼저 `components.securitySchemes`에 인증 방식을 이름 붙여 정의하는데 `type`은 `apiKey`, `http`, `mutualTLS`, `oauth2`, `openIdConnect` 중 하나입니다. JWT 베어러는 `type: http`, `scheme: bearer`, `bearerFormat: JWT`로 씁니다. 그다음 문서 최상위나 개별 operation의 `security`에서 그 이름을 참조해 필요한 방식을 적습니다. `security` 목록에 요구 객체가 여러 개면 그중 하나만 만족하면 되고, 한 객체 안에 방식이 여럿이면 모두 만족해야 합니다. 빈 객체 `{}`는 익명 접근도 허용한다는 뜻이고, OAuth2는 필요한 스코프를 값으로 적습니다. `bearerFormat`은 주로 문서용 힌트입니다.

(공식 문서) OpenAPI Specification 3.1.1의 Security Scheme Object는 `type` 값으로 `apiKey`, `http`, `mutualTLS`, `oauth2`, `openIdConnect`를 정의하고, `http`의 `bearerFormat`은 토큰 형식을 알려 주는 힌트로 주로 문서 목적이라고 한다. Security Requirement Object는 이름이 `components`의 보안 스킴과 대응해야 하고, 한 객체에 여러 스킴이 있으면 모두, 최상위나 Operation의 `security`에 객체가 여럿이면 그중 하나만 만족하면 된다고 하며, 빈 객체는 익명 접근을 허용한다고 한다. `oauth2`·`openIdConnect`의 값은 스코프 이름 목록이다. 최신판 3.2.1도 `type` 목록과 이 규칙이 같고, `deviceAuthorization` 플로우, 스킴의 `deprecated` 같은 항목과 보안 요구 객체의 URI 참조가 더해졌다.
(실험하지 않았다) 설치된 OpenAPI 검증 도구가 없어 문서를 돌려 보지 않았고 명세 문장만 근거로 적었다.
