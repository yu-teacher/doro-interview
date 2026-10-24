---
slug: "aut-20"
topic: "security-auth"
tier: TRICKY
difficulty: 3
title: "ID 토큰을 API 호출용 액세스 토큰으로 써도 되나요? JWT끼리 혼동되는 문제는 어떻게 막나요?"
keywords: ["ID 토큰의 대상은 클라이언트", "액세스 토큰의 대상은 리소스 서버", "aud 검증", "JWT 종류별 검증 규칙 분리", "typ으로 종류 명시"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://openid.net/specs/openid-connect-core-1_0.html", "https://www.rfc-editor.org/rfc/rfc8725.html", "https://www.rfc-editor.org/rfc/rfc9700.html"]
concepts: [oauth-oidc, jwt]
importance: 1
links: [{to: "aut-06", kind: PREREQ}, {to: "aut-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
API 호출용으로는 쓰지 않는 것이 맞습니다. ID 토큰은 사용자가 인증됐다는 사실을 클라이언트에 알리는 토큰이라 `aud`에 클라이언트의 `client_id`가 들어가고, API 접근에는 리소스 서버를 대상으로 한 액세스 토큰을 써야 합니다. 둘 다 JWT 모양일 수 있고 같은 발급자가 서명하므로, 리소스 서버가 서명과 `iss`만 보면 엉뚱한 종류의 토큰도 통과시킬 수 있습니다. RFC 8725는 이를 막으려고 `aud`를 검증하고, `typ`으로 종류를 명시하거나 필수 클레임과 키를 달리해서 JWT 종류별 검증 규칙이 서로 배타적이 되도록 하라고 권고합니다.

(공식 문서) OpenID Connect Core 1.0 2는 ID 토큰이 클라이언트를 대상으로 인증에 관한 클레임을 담는 보안 토큰이며 JWT로 표현된다고 하고, `aud`가 클라이언트의 `client_id`를 반드시 포함해야 한다고 한다. 3.1.3.7은 클라이언트가 `aud`에 자신이 없거나 신뢰하지 않는 수신자가 더 있는 ID 토큰은 거부해야 한다고 한다. 1.3은 액세스 토큰을 UserInfo 엔드포인트 호출에 쓴다고 설명한다.
(공식 문서) RFC 9700 2.3은 액세스 토큰을 특정 리소스 서버로 대상을 제한하고(SHOULD), 리소스 서버는 요청마다 토큰이 자신을 위한 것인지 확인해 아니면 거부해야 한다(MUST)고 한다. RFC 8725 2.8은 한 목적으로 발급된 JWT가 다른 목적에 쓰이는 교차 JWT 혼동을 위협으로 설명하고, 3.12는 같은 발급자가 여러 종류의 JWT를 낼 수 있으면 검증 규칙을 서로 배타적으로 작성해야 한다(MUST)며 `typ` 명시, 필수 클레임·헤더 값·키·`aud`·발급자를 달리하는 전략을 든다. 3.11은 새 JWT 용도에는 명시적 타이핑을 권장한다.
(보충) ID 토큰을 API 접근 토큰으로 쓰면 안 된다는 결론은 위 규정들(ID 토큰의 `aud`는 클라이언트, 리소스 서버는 자신을 대상으로 한 토큰만 받아야 함)에서 이끌어낸 추론이다. OpenID Connect Core에서 이를 한 문장으로 금지한 부분은 찾지 못했다.
