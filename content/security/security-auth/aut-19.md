---
slug: "aut-19"
topic: "security-auth"
tier: TRICKY
difficulty: 3
title: "OAuth 인가 요청에서 `redirect_uri`를 정확히 일치 검사해야 하는 이유와 `state`의 역할은 무엇인가요?"
keywords: ["등록된 URI와 정확한 문자열 일치", "패턴 매칭의 실제 공격 사례", "오픈 리다이렉터 금지", "state는 CSRF 방지용 일회용 값", "PKCE로 대체 가능"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc9700.html", "https://www.rfc-editor.org/rfc/rfc6749.html"]
concepts: [oauth-oidc]
importance: 1
links: [{to: "aut-11", kind: PREREQ}]
---
**모범 답변 (30~60초)**
인가 서버는 `redirect_uri`를 등록된 값과 패턴이 아니라 정확한 문자열로 비교해야 합니다. 검증이 느슨하면 공격자가 인가 코드나 토큰이 자기 쪽으로 돌아오게 만들 수 있기 때문입니다. RFC 9700은 패턴 매칭에서 실제 공격이 관찰됐다며 정확한 일치를 요구하고, 오픈 리다이렉터도 두지 말라고 합니다. `state`는 인가 요청과 콜백을 사용자 브라우저 세션에 묶는 일회용 무작위 값으로, 공격자의 인가 코드를 클라이언트의 콜백에 주입하는 CSRF를 막습니다. PKCE 지원이 확인된 서버라면 PKCE가 그 역할을 대신할 수도 있습니다.

(공식 문서) RFC 9700 4.1은 클라이언트가 리다이렉션 URI 패턴을 등록하게 하는 방식이 정확 일치보다 구현이 복잡하고 오류 나기 쉬우며, 패턴 매칭 결함이나 설정을 노린 공격이 실제로 관찰되었다고 한다. 4.1.3과 2.1은 인가 서버가 두 URI의 문자열이 같은지 정확히 비교해야 하고(예외는 네이티브 앱의 localhost 포트 번호), 클라이언트와 인가 서버가 임의 URI로 전달하는 오픈 리다이렉터를 노출하면 안 된다고 한다. 2.1과 4.7.1은 클라이언트가 CSRF를 막아야 하며, PKCE 지원이 확인되면 PKCE에, OIDC에서는 `nonce`에 맡길 수 있고 그렇지 않으면 사용자 에이전트에 묶인 일회용 CSRF 토큰을 `state`에 실어야 한다고 한다.
(공식 문서) RFC 6749 4.1.1은 `state`가 요청과 콜백 사이의 상태를 유지하는 값이며 CSRF 방지에 쓰도록(SHOULD) 권장한다고 하고, 10.12는 클라이언트가 리다이렉션 URI에 대한 CSRF 방어를 구현해야 하며 사용자 에이전트의 인증 상태에 묶인 값(예: 세션 쿠키의 해시)을 쓰는 것이 일반적이라고 한다.
