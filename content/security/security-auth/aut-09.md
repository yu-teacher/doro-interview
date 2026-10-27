---
slug: "aut-09"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "서버가 JWT를 받으면 무엇을 검증해야 하나요? 서명만 맞으면 충분한가요?"
keywords: ["서명 검증", "허용 알고리즘 고정", "iss 발급자 확인", "aud 대상 확인", "exp·nbf 유효 시간"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc7519.html", "https://www.rfc-editor.org/rfc/rfc8725.html", "https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html"]
concepts: [jwt]
importance: 2
links: [{to: "aut-16", kind: FOLLOWUP}, {to: "sec-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
서명만 맞다고 끝이 아닙니다. 먼저 서버가 정한 알고리즘과 키로 서명을 검증하고, 토큰 헤더의 `alg`를 그대로 믿지 않습니다. 그다음 `iss`가 신뢰하는 발급자인지, `aud`에 우리 서비스가 들어 있는지, `exp`와 `nbf`로 지금 유효한 시간인지 확인합니다. Spring Security 리소스 서버는 `issuer-uri`를 설정하면 서명, `exp`, `nbf`, `iss`를 검증하지만 `aud`는 `audiences` 속성이나 별도 검증기를 설정해야 합니다. 기본으로 신뢰하는 서명 알고리즘은 RS256 하나입니다.

```
정상          : accept sub=user-1
페이로드 변조 : reject: bad signature
만료 후       : reject: expired
다른 aud      : reject: aud
다른 iss      : reject: iss
```

(공식 문서) RFC 7519 7.2는 JWT 검증 절차를 규정하고 실패하면 거부해야 한다고 하며, 검증이 성공해도 쓰인 알고리즘이 애플리케이션이 받아들일 수 있는 것이 아니면 거부해야 한다(SHOULD)고 한다. 4.1.3은 `aud` 클레임이 있는데 처리 주체가 거기서 자신을 식별하지 못하면 거부해야 한다고 하고, 4.1.4와 4.1.5는 `exp` 이후와 `nbf` 이전에는 받아들이면 안 되며 시계 오차를 위해 몇 분 이내의 여유를 줄 수 있다고 한다. RFC 8725 3.1은 라이브러리가 호출자가 지정한 알고리즘 집합만 쓰고 각 키는 하나의 알고리즘으로만 쓰라고 하며, 3.8과 3.9는 `iss`가 있으면 키가 그 발급자의 것인지 확인하고, 하나의 발급자가 여러 수신자용 JWT를 낼 수 있으면 `aud`를 반드시 검증하라고 한다.
(공식 문서) Spring Security 7.1.2 리소스 서버 JWT 문서는 서명을 jwks 엔드포인트의 공개 키로 검증하고 `exp`, `nbf` 타임스탬프와 `iss`를 검증한다고 설명한다. `issuer-uri`는 `iss`를, `audiences` 속성은 `aud`를 검증하며, `NimbusJwtDecoder`는 기본으로 RS256만 신뢰한다고 한다.
(실험 확인) Node 24로 직접 짠 검증기(허용 알고리즘 고정, `iss`·`aud`·`exp` 확인)를 돌려 정상 토큰은 통과하고 위 블록처럼 페이로드를 바꾼 토큰, 만료 시각을 지난 토큰, 다른 `aud`·`iss`의 토큰이 거부됨을 확인했다(2026-10-24 재실행, 같은 출력). `nbf` 검사는 이 코드에 없어 실험하지 않았다. 개념 확인용 코드이며 실제 서비스에서는 검증된 라이브러리를 써야 한다.
