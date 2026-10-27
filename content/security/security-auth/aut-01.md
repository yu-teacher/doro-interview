---
slug: "aut-01"
topic: "security-auth"
tier: BASIC
difficulty: 1
title: "인증(Authentication)과 인가(Authorization)는 무엇이 다르고, HTTP 401과 403은 각각 어느 쪽에 해당하나요?"
keywords: ["누구인지 확인하는 인증", "무엇을 해도 되는지 정하는 인가", "401 유효한 자격 증명 없음", "403 이해했지만 거부", "인증 결과를 인가가 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html", "https://docs.spring.io/spring-security/reference/servlet/authorization/architecture.html", "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"]
concepts: [authn-authz]
importance: 3
links: [{to: "aut-02", kind: FOLLOWUP}, {to: "aut-13", kind: FOLLOWUP}, {to: "sec-01", kind: RELATED}, {to: "web-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
인증은 요청한 사람이 누구인지 확인하는 일이고, 인가는 확인된 그 사람이 이 자원에 이 작업을 해도 되는지 결정하는 일입니다. 순서로는 인증이 먼저고, 인가는 인증 결과를 입력으로 씁니다. HTTP 상태 코드로는 유효한 인증 자격 증명이 없어서 처리하지 않았을 때 401, 요청은 이해했지만 수행을 거부할 때 403을 씁니다. 로그인은 했는데 권한이 부족한 경우가 전형적인 403입니다. Spring Security도 인증 단계가 `Authentication`에 권한 목록을 채우고 인가 단계가 그것을 읽어 판단하도록 나뉘어 있습니다.

(공식 문서) RFC 9110 15.5.2는 401을 대상 리소스에 대한 유효한 인증 자격 증명이 없어 요청이 적용되지 않았다는 뜻으로 정의한다. 15.5.4는 403을 서버가 요청을 이해했지만 수행을 거부한다는 뜻으로 정의하고, 자격 증명이 제공됐다면 서버가 그것을 접근을 허용하기에 불충분하다고 본 것이며 자격 증명과 무관한 이유로도 금지될 수 있다고 한다.
(원저자 자료) OWASP Authorization Cheat Sheet는 인가를 NIST를 인용해 요청된 행위가 특정 주체에게 승인됐는지 확인하는 과정으로 정의하고, 주체의 신원을 확인하는 인증과는 구별된다고 한다. 인증된 사용자라고 해서 시스템이 기술적으로 허용하는 모든 자원과 작업에 대한 권한이 있는 것은 아니라는 설명도 한다.
(공식 문서) Spring Security 서블릿 인증 아키텍처 문서는 `GrantedAuthority`를 `Authentication`의 주체에게 부여된 권한(역할, 스코프 등)이라고 설명한다. 인가 아키텍처 문서는 이 객체가 `AuthenticationManager`에 의해 `Authentication`에 들어가고 나중에 `AuthorizationManager`가 인가 결정을 내릴 때 읽는다고 한다.
