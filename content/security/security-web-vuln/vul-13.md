---
slug: "vul-13"
topic: "security-web-vuln"
tier: DEEP
difficulty: 3
title: "CSP(Content Security Policy)는 XSS를 어떻게 완화하고, nonce 방식은 무엇인가요?"
keywords: ["허용한 출처의 스크립트만 실행", "인라인 스크립트 차단", "응답마다 새로 만드는 nonce", "방어 심층", "Report-Only로 단계 적용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.w3.org/TR/CSP3/", "https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html", "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html"]
concepts: [xss, web-security]
importance: 2
links: [{to: "vul-04", kind: PREREQ}, {to: "vul-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
CSP는 서버가 응답 헤더로, 이 페이지가 어디서 온 스크립트와 리소스만 실행하거나 불러올 수 있는지를 브라우저에 알려 주는 정책입니다. 인라인 스크립트와 임의의 외부 스크립트를 막으면, XSS로 코드가 주입돼도 실행되지 못하게 할 수 있습니다. 인라인 스크립트가 꼭 필요하면 `unsafe-inline` 대신 응답마다 새로 만든 예측 불가능한 nonce를 헤더와 `script` 태그에 함께 넣거나 해시를 씁니다. 다만 W3C 명세도 CSP는 첫 번째 방어선이 아니라 피해를 줄이는 방어 심층이라고 하므로 출력 인코딩을 대신할 수 없습니다. 처음에는 `Content-Security-Policy-Report-Only`로 위반 보고만 받으면서 정책을 다듬습니다.

```
Content-Security-Policy: script-src 'nonce-e9U53J12aq0ob_mReFMONQ'; object-src 'none'   (첫 응답)
Content-Security-Policy: script-src 'nonce-1tDibQtVPC0j7eItVWc_aA'; object-src 'none'   (다음 응답, 값이 다름)
```

(공식 문서) W3C CSP Level 3 1절은 CSP를 XSS 같은 콘텐츠 주입 위험을 줄이고 애플리케이션 권한을 낮추는 도구로 소개하면서, 첫 번째 방어선이 아니라 방어 심층으로 쓰는 것이 최선이며 입력 검증과 출력 인코딩을 대체하지 않는다고 밝힌다. 6절은 개발자가 스크립트와 플러그인을 제한하는 지시문을 넣고 `'unsafe-inline'`과 `data:`를 허용하지 말아야 한다고 한다(SHOULD NOT). 7.1절은 nonce를 쓰면 정책을 보낼 때마다 고유한 값을 생성해야 하고(MUST), 암호학적으로 안전한 난수로 만든 128비트 이상 값을 권한다(SHOULD). 같은 절의 주석은 nonce로 인라인을 허용하는 것이 nonce 없이 막는 것보다는 덜 안전하지만 `'unsafe-inline'`보다는 크게 낫다고 한다. 3.2절은 Report-Only 헤더로 정책을 시험하고 위반 보고를 본 뒤 강제 정책으로 옮길 수 있다고 하며, 3.3절은 `meta` 요소로 전달한 정책에서 Report-Only 헤더와 `frame-ancestors` 등이 지원되지 않는다고 한다.
(원저자 자료) OWASP CSP Cheat Sheet는 현재의 모범 사례가 nonce 방식이나 해시 방식의 엄격한 CSP라고 하고, nonce는 템플릿 엔진으로 렌더링해야 하며 모든 script 태그에 nonce를 일괄 삽입하는 미들웨어는 공격자가 주입한 스크립트에도 nonce가 붙으므로 쓰면 안 된다고 경고한다. XSS 시트는 CSP를 주된 방어로 삼지 말라고 한다.
(실험 확인) Python 3.14 `secrets.token_urlsafe(16)`을 두 번 호출해 128비트 nonce가 호출마다 달라짐을 확인했다. 브라우저의 정책 집행은 실행하지 못했으며 명세 근거로만 쓴다.
