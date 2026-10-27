---
slug: "vul-10"
topic: "security-web-vuln"
tier: DEEP
difficulty: 2
title: "세션 고정(Session Fixation) 공격은 무엇이고, 어떻게 막나요?"
keywords: ["공격자가 아는 세션 ID를 피해자에게 심음", "로그인 후 세션 ID 재발급", "URL에 세션 ID 금지", "서버에서 세션 무효화", "서버가 발급하지 않은 ID 거부"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://www.rfc-editor.org/rfc/rfc6265.html", "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", "https://owasp.org/Top10/2021/A07_2021-Identification_and_Authentication_Failures/index.html", "https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html"]
concepts: [session-token-auth]
importance: 2
links: [{to: "aut-15", kind: RELATED}, {to: "sec-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
세션 고정은 공격자가 자기가 알고 있는 세션 ID를 피해자의 브라우저에 심어 두고, 피해자가 그 세션으로 로그인하면 같은 ID로 피해자의 권한을 얻는 공격입니다. 핵심 방어는 로그인처럼 권한 수준이 바뀌는 시점에 세션 ID를 새로 발급하는 것입니다. 여기에 세션 ID를 URL로 받지 않고, 서버가 발급하지 않은 ID는 받아들이지 않으며, 쿠키에 Secure를 설정해 HTTPS로만 주고받게 하고, 로그아웃과 타임아웃 때 서버 쪽에서 세션을 무효화합니다. Spring Security는 로그인 시 세션 ID를 바꾸는 보호를 자동으로 하고, 서블릿 3.1 이상에서는 `changeSessionId`가 기본 전략입니다.

(공식 문서) RFC 6265 8.4절은 세션 고정을 세 단계로 설명한다. 공격자가 자기 세션 식별자를 피해자의 사용자 에이전트에 옮기고, 피해자가 그 식별자로 서버와 상호작용해 자격이나 기밀이 묶이면, 공격자가 같은 식별자로 서버와 직접 상호작용해 권한을 얻는다. 서버가 이 취약점을 피하도록 주의해야 한다고(SHOULD) 한다.
(원저자 자료) OWASP Session Management Cheat Sheet는 권한 수준이 바뀌면 세션 ID를 갱신해야 하고 인증 과정이 가장 흔한 사례라고 하며, 서버가 발급하지 않은 세션 ID를 받아들이는 허용형 방식 대신 발급한 것만 받는 엄격형을 설명한다. URL에 세션 ID를 싣는 방식은 노출과 고정 공격을 쉽게 만든다고 하고, 암호화된 채널과 Secure 쿠키는 트래픽을 가로채 ID를 주입하는 일부 고정 공격도 막아 준다고 하며, 서버 쪽 무효화를 필수로 요구한다. Top 10:2021 A07 페이지는 로그인 성공 뒤 세션 식별자를 재사용하는 것과 URL에 노출하는 것을 취약 조건으로 든다.
(공식 문서) Spring Security 세션 관리 문서는 로그인 시 새 세션을 만들거나 세션 ID를 바꿔 이 공격을 자동으로 막으며, `changeSessionId`, `newSession`, `migrateSession` 세 전략 중 서블릿 3.1 이상에서는 `changeSessionId`가 기본이라고 한다.
