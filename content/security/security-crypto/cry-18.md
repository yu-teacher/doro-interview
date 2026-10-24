---
slug: "cry-18"
topic: "security-crypto"
tier: TRICKY
difficulty: 3
title: "JWT 서명 검증에서 알고리즘 혼동(alg none, RS256을 HS256으로 바꾸기)은 무엇이고 어떻게 막나요?"
keywords: ["헤더의 alg를 그대로 신뢰하지 않기", "alg none은 서명 검증 생략", "RS256을 HS256으로 바꿔 공개키를 HMAC 키로 사용", "허용 알고리즘 고정", "키마다 알고리즘 하나"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc8725.html", "https://www.rfc-editor.org/rfc/rfc7515.html", "https://www.rfc-editor.org/rfc/rfc7518.html"]
concepts: [jwt, mac-signature]
importance: 2
links: [{to: "cry-11", kind: PREREQ}, {to: "aut-16", kind: RELATED}, {to: "aut-09", kind: RELATED}]
---
**모범 답변 (30~60초)**
JWT 헤더의 `alg`는 공격자가 바꿀 수 있는 값입니다. RFC 8725는 `alg`를 `none`으로 바꾸면 서명 검증 없이 통과시키는 라이브러리와, RS256을 HS256으로 바꿔 RSA 공개키를 HMAC 비밀 키처럼 쓰게 만드는 라이브러리가 있었다고 설명합니다. 방어는 헤더를 믿지 않고 서버가 허용 알고리즘 목록을 정해 두고 그 밖은 거부하는 것입니다. RFC 8725는 키 하나를 정확히 한 알고리즘에만 쓰고 검증 때 확인하라고 하며, `none`은 호출자가 명시하지 않는 한 받아들이지 말라고 합니다.

```
허용 알고리즘을 HS256 으로 고정한 검증기 (내가 만든 설명용 코드)
  정상 토큰                  -> OK
  헤더 alg=none, 서명 없음   -> REJECT alg 'none'
  헤더 alg=RS256             -> REJECT alg 'RS256'
  페이로드 변경              -> REJECT bad signature
```

(공식 문서) RFC 8725 의 2.1 은 서명된 JWT 가 `alg` 헤더로 알고리즘을 표시하는 구조 때문에 `none` 으로 바꾸면 서명 없이 검증된 것으로 취급하는 라이브러리와, RS256 을 HS256 으로 바꿔 RSA 공개키를 HMAC 공유 비밀로 검증하는 라이브러리가 있었다고 적는다. 3.1 은 라이브러리가 호출자가 지정한 알고리즘 집합만 쓰고 `alg` 헤더가 실제 연산의 알고리즘과 같음을 확인해야 하며 각 키는 정확히 한 알고리즘으로만 써야 한다고 규정한다. 3.2 는 `none` 알고리즘이 다른 수단으로 보호될 때만 쓰고 라이브러리는 호출자가 명시적으로 요청하지 않으면 `none` 토큰을 만들거나 받아들이지 않아야(SHOULD NOT) 한다고 한다. 3.2 는 RFC 7515 의 5.2 를 인용하며, 서명이 유효해도 알고리즘이 애플리케이션이 받아들일 수 있는 것이 아니면 그 JWS 를 무효로 보아야 한다(SHOULD)고 하고, 애플리케이션은 암호학적으로 현행인 알고리즘만 허용해야 한다(MUST)고 한다. 같은 문장이 RFC 7515 의 5.2 원문에도 있다.
(실험 확인) Python 3.14 로 허용 알고리즘을 고정한 검증 함수를 직접 만들어 위 네 경우의 결과를 확인했다. 실제 JWT 라이브러리를 시험한 것은 아니며 방어 원칙을 확인하는 설명용 코드다. 다시 실행해 같은 결과를 확인했다.
