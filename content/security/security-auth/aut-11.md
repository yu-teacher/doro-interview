---
slug: "aut-11"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "Authorization Code 방식과 PKCE는 어떻게 동작하나요?"
keywords: ["인가 코드를 토큰으로 교환", "code_verifier와 code_challenge", "S256 해시", "코드 가로채기 방어", "토큰 요청 때 verifier 검증"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6749.html", "https://www.rfc-editor.org/rfc/rfc7636.html", "https://www.rfc-editor.org/rfc/rfc9700.html", "https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html"]
concepts: [oauth-oidc]
importance: 2
links: [{to: "aut-05", kind: PREREQ}, {to: "aut-18", kind: FOLLOWUP}, {to: "aut-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
인가 코드 방식은 클라이언트가 사용자를 인가 서버로 보내 로그인과 동의를 받고, 돌아올 때 URL로 받은 짧은 수명의 인가 코드를 토큰 엔드포인트에서 액세스 토큰으로 바꾸는 흐름입니다. PKCE는 그 코드를 가로채 쓰는 공격을 막기 위해, 클라이언트가 요청마다 무작위 `code_verifier`를 만들고 그 SHA-256 해시인 `code_challenge`를 인가 요청에 실어 보냅니다. 토큰을 교환할 때 원본 verifier를 내야 서버가 해시를 비교해 통과시키므로, 코드만 훔친 쪽은 토큰을 받지 못합니다.

```
RFC vector ok: True            (RFC 7636 부록의 verifier -> challenge 일치)
verifier len: 43
공격자가 code만 가로챔(verifier 없음): invalid_grant (verifier mismatch)
정상 클라이언트: access_token
같은 code 재사용: invalid_grant (unknown/used code)
```

(공식 문서) RFC 6749 4.1은 인가 코드 방식을 사용자 에이전트 리다이렉션으로 코드를 받은 뒤 토큰 엔드포인트에서 토큰으로 교환하는 흐름으로 설명하고, 4.1.2는 코드가 발급 직후 곧 만료되어야 하며 최대 10분을 권장하고 한 번만 써야 한다고 한다. RFC 7636 1은 공개 클라이언트가 인가 코드 가로채기 공격에 취약하다고 하고, 4.1과 4.2는 verifier를 43~128자의 고엔트로피 문자열로, challenge를 S256이면 verifier의 SHA-256을 base64url한 값으로 만든다고 한다. 4.6은 서버가 받은 verifier로 challenge를 다시 계산해 비교하고 다르면 `invalid_grant` 오류를 반드시 돌려줘야 한다(MUST)고 한다.
(공식 문서) RFC 9700 2.1.1은 공개 클라이언트가 PKCE를 반드시 써야 하고 기밀 클라이언트도 쓰기를 권장하며, 이 조언이 웹 애플리케이션을 포함한 모든 클라이언트에 적용된다고 한다. 또 verifier를 노출하지 않는 방식은 현재 S256뿐이라고 한다. 다만 기밀 OpenID Connect 클라이언트는 추가 조치를 전제로 PKCE 대신 `nonce`를 쓸 수 있다고도 한다(MAY). Spring Security 클라이언트 문서는 클라이언트 시크릿이 없고 클라이언트 인증 방식이 none인 경우 등에 PKCE가 자동으로 쓰인다고 한다.
(실험 확인) Python 3.14로 S256 변환을 구현해 RFC 7636 부록의 예시 verifier가 예시 challenge와 일치함을 확인했고(2026-10-24 재실행, 같은 출력), 인가 서버 역할을 하는 단순 모델에서 코드만 가진 쪽의 토큰 요청이 거부되고 같은 코드의 재사용이 거부됨을 확인했다. 내가 짠 모델이므로 프로토콜 로직의 확인이며 실제 서버 구현을 검증한 것은 아니다.
