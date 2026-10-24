---
slug: "cry-07"
topic: "security-crypto"
tier: BASIC
difficulty: 1
title: "JWT의 서명은 암호화인가요? 페이로드에 민감한 정보를 넣어도 되나요?"
keywords: ["서명은 변조 방지", "페이로드는 Base64url 인코딩일 뿐", "키 없이 누구나 디코딩", "민감 정보는 넣지 않기", "기밀성은 JWE나 TLS"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc7519.html", "https://www.rfc-editor.org/rfc/rfc7515.html", "https://www.rfc-editor.org/rfc/rfc4648.html"]
concepts: [jwt, mac-signature]
importance: 3
links: [{to: "cry-02", kind: PREREQ}, {to: "aut-03", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. 서명된 JWT는 헤더와 페이로드를 Base64url로 인코딩한 값에 서명을 붙인 것이라, 서명은 변조를 막을 뿐 내용을 숨기지는 않습니다. 누구나 키 없이 페이로드를 디코딩해 읽을 수 있으므로 비밀번호 같은 민감 정보를 넣으면 안 됩니다. HS256이든 RS256이든 이 점은 같습니다. RFC 7519는 민감한 정보가 담길 수 있다면 암호화된 JWT(JWE)를 쓰거나 TLS처럼 암호화되는 전송로로만 보내라고 하고, 가장 간단한 방법은 민감 정보를 아예 넣지 않는 것이라고 합니다.

```
payload(디코드) -> {"sub": "u1", "role": "user", "ssn": "secret-123"}   (키 없이 읽힘)
```

(공식 문서) RFC 7515 의 1절은 JWS 의 암호 메커니즘이 임의 옥텟열의 무결성 보호를 제공한다고 한다. RFC 7519 의 1절은 JWT 가 JWS 의 페이로드나 JWE 의 평문으로 쓰이며 클레임을 서명하거나 MAC 으로 무결성을 보호하고 및/또는 암호화할 수 있다고 설명한다. 12절(프라이버시)은 JWT 에 민감 정보가 담길 수 있으면 노출을 막는 조치를 해야 하며, 방법으로 암호화된 JWT 를 쓰고 수신자를 인증하거나 암호화 프로토콜(TLS)로만 전송하는 것을 들고, 민감 정보를 JWT 에서 빼는 것이 가장 간단하다고 한다. RFC 7515 의 3.1 은 JWS 컴팩트 직렬화를 헤더·페이로드·서명 각각의 base64url 인코딩을 점으로 이은 것으로 정의하고, base64url 은 RFC 4648 5절의 문자 집합을 쓴다고 한다. RFC 4648 의 12절은 베이스 인코딩이 계산상의 기밀성을 제공하지 않는다고 적는다.
(실험 확인) Python 3.14 로 HS256 서명 토큰을 직접 만든 뒤 키 없이 두 번째 조각을 base64url 디코딩하면 클레임이 그대로 읽히는 것을 다시 실행해 확인했다(위 블록). 이 토큰은 연습용이다.
