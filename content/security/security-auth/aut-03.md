---
slug: "aut-03"
topic: "security-auth"
tier: BASIC
difficulty: 1
title: "JWT는 어떤 구조이고, 페이로드에 비밀번호 같은 정보를 넣어도 되나요?"
keywords: ["헤더·페이로드·서명 세 부분", "base64url 인코딩", "서명은 변조 탐지용", "서명된 JWT는 암호화가 아님", "iss·sub·aud·exp 클레임"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc7519.html", "https://www.rfc-editor.org/rfc/rfc7515.html"]
concepts: [jwt]
importance: 3
links: [{to: "aut-09", kind: FOLLOWUP}, {to: "aut-10", kind: FOLLOWUP}, {to: "cry-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
흔히 쓰는 서명된 JWT는 점으로 구분한 세 덩어리, 즉 헤더, 페이로드, 서명으로 이루어집니다. 헤더에는 서명 알고리즘 `alg` 같은 메타 정보가, 페이로드에는 발급자 `iss`, 주체 `sub`, 대상 `aud`, 만료 `exp` 같은 클레임이 들어가고, 각 부분은 base64url로 인코딩됩니다. 서명은 내용이 바뀌지 않았음을 확인하는 용도이지 내용을 숨기는 장치가 아닙니다. 그래서 서명된 JWT의 페이로드는 키 없이 누구나 디코딩해 읽을 수 있으니 비밀번호 같은 민감 정보를 넣으면 안 됩니다.

```
parts = 3
decoded header  = {"alg":"HS256","typ":"JWT"}
decoded payload = {"iss":"https://auth.example.com","sub":"user-1","aud":"orders-api","exp":1792846065,"role":"USER"}
```

(공식 문서) RFC 7519 1과 3은 JWT가 클레임 집합을 JWS의 페이로드나 JWE의 평문으로 담는 구조이며, 항상 JWS Compact Serialization 또는 JWE Compact Serialization으로 표현되고 base64url 값을 점으로 이은 형태라고 설명한다. 클레임이 JWS면 서명 또는 MAC으로 보호되고, JWE면 암호화된다. RFC 7515 7.1은 JWS Compact Serialization을 보호 헤더, 페이로드, 서명을 각각 base64url로 인코딩해 점으로 이은 문자열로 정의한다. RFC 7515 4.1.1은 `alg`가 JWS를 보호하는 데 쓴 알고리즘을 식별한다고 한다. RFC 7519 4.1은 `iss`, `sub`, `aud`, `exp` 등을 등록 클레임으로 정의하며 모두 필수는 아니라고 한다. 12절은 JWT에 개인정보 등 민감한 정보가 들어 있을 수 있고 이때 외부 노출을 막는 조치를 반드시 해야 한다고 하며, 방법으로 암호화된 JWT, 전송 구간 암호화(TLS)를 들고 민감 정보를 JWT에서 빼는 것이 가장 간단하다고 한다.
(실험 확인) Node 24에서 HS256으로 서명한 JWT를 만들어 점으로 나눈 결과 3부분이었고, 앞 두 부분은 서명 키 없이 base64url 디코딩만으로 위 블록처럼 읽혔다(시간 값은 실행 시점의 것). 2026-10-24에 스크립트를 다시 실행해 같은 출력을 확인했다.
