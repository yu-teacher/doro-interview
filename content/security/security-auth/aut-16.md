---
slug: "aut-16"
topic: "security-auth"
tier: TRICKY
difficulty: 3
title: "JWT 서명 검증에서 헤더의 `alg` 값을 그대로 따르면 왜 위험한가요?"
keywords: ["alg는 토큰 작성자가 적는 값", "none 알고리즘 악용", "RS256을 HS256으로 바꿔치기", "허용 알고리즘 목록 고정", "키 하나에 알고리즘 하나"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc8725.html", "https://www.rfc-editor.org/rfc/rfc7519.html", "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html"]
concepts: [jwt]
importance: 2
links: [{to: "aut-09", kind: PREREQ}, {to: "cry-18", kind: RELATED}]
---
**모범 답변 (30~60초)**
토큰 헤더의 `alg`는 토큰을 만든 쪽이 적는 값이라 검증하는 쪽이 믿을 근거가 없습니다. 이 값을 그대로 따르는 구현에서는 `none`으로 바꿔 서명 검증을 건너뛰게 하거나, RS256을 HS256으로 바꿔 공개 키를 HMAC 비밀키처럼 쓰게 하는 공격이 알려져 있습니다. 방어는 서버가 허용 알고리즘 목록을 직접 정해 그 밖의 알고리즘은 거부하고, 키 하나를 알고리즘 하나에만 쓰는 것입니다. Spring Security 리소스 서버도 기본으로는 RS256만 신뢰합니다.

```
RS256 정상    : accept sub=user-1
alg=none      : reject: alg none not allowed
HS256+공개키  : reject: alg HS256 not allowed
```

(공식 문서) RFC 8725 2.1은 서명 JWT가 `alg` 헤더로 알고리즘을 명시하는 점과 일부 라이브러리의 설계 결함 때문에 `none`으로 바꾸면 서명 검증 없이 통과시키거나 RS256을 HS256으로 바꿔 RSA 공개 키를 HMAC 비밀로 쓰는 공격이 있었다고 설명한다. 3.1은 라이브러리가 호출자가 지정한 알고리즘 집합만 쓰고, `alg`가 실제 쓰는 알고리즘과 같은지 확인하며, 각 키는 정확히 하나의 알고리즘으로만 써야 한다고 한다. 3.2는 `none`을 라이브러리가 호출자의 명시적 요청 없이 생성·수용하지 않아야 한다(SHOULD NOT)고 하고, 전송 계층 등 다른 수단으로 보호되는 경우에만 쓸 수 있다고 한다.
(공식 문서) RFC 7519 8은 적합한 구현이 HS256과 `none`을 반드시 구현해야 한다고 한다. 지원 여부와 수용 여부는 별개이므로 허용 목록으로 걸러야 한다. Spring Security 리소스 서버 문서는 `NimbusJwtDecoder`가 기본으로 RS256 토큰만 신뢰하고 검증한다고 한다.
(실험 확인) Node 24로 직접 짠 RS256 검증기에 정상 토큰, `alg`를 `none`으로 한 토큰, 공개 키를 HMAC 키로 서명한 HS256 토큰을 넣어 위 블록처럼(2026-10-24 재실행, 같은 출력) 앞의 것만 통과하고 나머지는 알고리즘 허용 목록 검사에서 거부됨을 확인했다. 거부 동작을 보이는 방어 쪽 확인이며 라이브러리 취약점을 재현한 것은 아니다.
