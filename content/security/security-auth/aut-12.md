---
slug: "aut-12"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "Client Credentials 방식은 언제 쓰고, 사용자 로그인에 쓸 수 없는 이유는 무엇인가요?"
keywords: ["사용자 없는 서버 간 호출", "클라이언트 자격 증명으로 토큰 발급", "기밀 클라이언트만 사용", "사용자 동의 단계 없음", "최소 스코프"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6749.html", "https://www.rfc-editor.org/rfc/rfc9700.html", "https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html"]
concepts: [oauth-oidc]
importance: 2
links: [{to: "aut-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
사용자 없이 서비스가 자기 이름으로 다른 API를 호출할 때 쓰는 방식입니다. 예컨대 배치 서버나 다른 서비스가 클라이언트 ID와 시크릿 같은 자기 자격 증명으로 토큰 엔드포인트에 요청해 액세스 토큰을 바로 받고, 사용자 리다이렉트나 동의 단계는 없습니다. 비밀을 안전하게 보관하는 기밀 클라이언트에서만 써야 합니다. 이 흐름에는 사용자 인증이 없어서 토큰이 특정 사용자를 나타내지 않으므로 사용자 로그인이나 사용자별 권한 판단에는 맞지 않습니다. 스코프는 필요한 최소한으로 줍니다.

(공식 문서) RFC 6749 4.4는 클라이언트가 자신이 통제하는 자원이나 사전에 합의된 다른 소유자의 자원에 접근할 때 클라이언트 자격 증명만으로 토큰을 요청할 수 있다고 하고, 이 방식은 기밀 클라이언트만 써야 한다(MUST)고 한다. 4.4.1은 클라이언트 인증이 곧 인가 승인이라 별도의 인가 요청이 필요 없다고 한다. RFC 9700 2.3은 액세스 토큰의 권한을 필요한 최소한으로 제한하라고 권고한다(SHOULD). Spring Security 클라이언트 문서는 `authorization-grant-type: client_credentials`와 `scope` 설정 예시를 보여 준다.
(보충) 흐름에 사용자가 등장하지 않으므로 토큰이 사용자를 대표하지 않는다는 결론은 4.4.1의 흐름 설명에서 이끌어낸 추론이며 문서가 그 문장 그대로 쓰고 있지는 않다.
