---
slug: "aut-15"
topic: "security-auth"
tier: DEEP
difficulty: 2
title: "세션 고정(Session Fixation) 공격은 무엇이고, Spring Security는 어떻게 막나요?"
keywords: ["공격자가 정한 세션 ID 강요", "로그인 후에도 같은 ID 유지가 문제", "로그인 시 세션 ID 재발급", "changeSessionId 기본 전략", "URL 파라미터 세션 ID 거부"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html"]
concepts: [session-token-auth]
importance: 2
links: [{to: "vul-10", kind: RELATED}, {to: "sec-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
세션 고정은 공격자가 미리 만들어 둔 세션 ID를 피해자가 쓰게 만들고, 피해자가 그 세션으로 로그인하면 같은 ID로 접속해 로그인 상태를 가로채는 공격입니다. 방어의 핵심은 로그인처럼 권한 수준이 바뀌는 순간에 세션 ID를 새로 발급하는 것입니다. Spring Security는 로그인할 때 새 세션을 만들거나 세션 ID를 바꿔 자동으로 막고, Servlet 3.1 이상 컨테이너의 기본값은 기존 세션을 유지하면서 ID만 바꾸는 `changeSessionId`입니다. URL 파라미터로 들어온 세션 ID를 받아들이지 않는 것도 도움이 됩니다.

(공식 문서) Spring Security 세션 관리 문서는 공격자가 사이트에 접속해 세션을 만든 뒤 세션 ID가 담긴 링크 등으로 다른 사용자를 같은 세션으로 로그인하게 만드는 것이 세션 고정이라고 설명한다. 로그인 시 새 세션을 만들거나 세션 ID를 바꿔 자동으로 막고, 전략으로 `changeSessionId`(Servlet 3.1 이상의 기본값), `newSession`, `migrateSession`을 제시한다.
(원저자 자료) OWASP Session Management Cheat Sheet는 권한 수준이 바뀐 뒤(대표적으로 인증 과정)에는 세션 ID를 반드시 갱신해야 하며 그것이 세션 고정을 막는 데 필수라고 한다. 또 URL 파라미터 같은 다른 경로로 제출된 세션 ID는 받아들이지 않는 것이 방어 전략이라고 한다.
