---
slug: "aut-06"
topic: "security-auth"
tier: BASIC
difficulty: 2
title: "OAuth 2.0은 로그인(인증) 프로토콜인가요? OpenID Connect는 무엇을 더하나요?"
keywords: ["OAuth는 위임 인가 프레임워크", "인증 정보 제공 표준이 없음", "OIDC는 OAuth 위의 신원 계층", "ID 토큰", "openid 스코프"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6749.html", "https://openid.net/specs/openid-connect-core-1_0.html"]
concepts: [oauth-oidc, authn-authz]
importance: 3
links: [{to: "aut-05", kind: PREREQ}, {to: "aut-20", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
아닙니다. OAuth 2.0은 클라이언트가 사용자 대신 자원에 접근하도록 권한을 위임하는 인가 프레임워크입니다. 액세스 토큰은 클라이언트에 발급된 인가를 나타낼 뿐이고, OpenID Connect 사양은 OAuth 2.0만으로는 최종 사용자의 인증 정보를 제공하는 표준 방법이 없다고 설명합니다. 소셜 로그인처럼 신원 확인이 필요하면 OAuth 위에 OpenID Connect를 얹습니다. 인증 요청에 `openid` 스코프를 넣으면 인증 결과를 담은 ID 토큰을 JWT로 받고, 클라이언트가 그것을 검증해 사용자를 식별합니다. 추가 정보는 액세스 토큰으로 UserInfo 엔드포인트에서 가져옵니다.

(공식 문서) RFC 6749는 제목부터 인가 프레임워크이고, 1.4는 액세스 토큰을 클라이언트에 발급된 인가를 나타내는 문자열이라고 설명한다.
(공식 문서) OpenID Connect Core 1.0 1은 OpenID Connect를 OAuth 2.0 위의 단순한 신원 계층이라고 소개하며, 인가 서버가 수행한 인증에 근거해 클라이언트가 최종 사용자의 신원을 확인하게 해 준다고 한다. 같은 절은 RFC 6749와 6750이 액세스 토큰을 얻고 쓰는 메커니즘은 정의하지만 신원 정보를 제공하는 표준 방법은 정의하지 않고, OAuth 2.0은 프로파일링 없이는 최종 사용자의 인증에 관한 정보를 제공할 수 없다고 하며, openid 스코프로 이 확장을 요청해 ID 토큰(JWT)으로 인증 정보를 돌려받는다고 한다. 2는 사용자 인증을 가능하게 하는 OAuth 2.0에 대한 주된 확장이 ID 토큰이며 JWT로 표현된다고 한다. 3.1.2.1은 OIDC 요청이 `openid` 스코프를 반드시 포함해야 한다고 하고, 1.3은 OP가 ID 토큰과 보통 액세스 토큰을 돌려주고, RP가 액세스 토큰으로 UserInfo 엔드포인트를 호출해 최종 사용자에 대한 클레임을 받는다고 설명한다. 3.1.3.7은 클라이언트가 ID 토큰을 검증한다고 정한다.
