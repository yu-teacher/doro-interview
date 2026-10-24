---
slug: "vul-05"
topic: "security-web-vuln"
tier: BASIC
difficulty: 1
title: "CSRF는 무엇이고, 왜 쿠키 인증에서 문제가 되나요?"
keywords: ["의도하지 않은 요청 전송", "쿠키 자동 전송", "상태 변경 요청", "서버가 요청 출처를 구분하지 못함"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", "https://www.rfc-editor.org/rfc/rfc6265.html"]
concepts: [csrf, cookie]
importance: 3
links: [{to: "vul-08", kind: FOLLOWUP}, {to: "vul-18", kind: FOLLOWUP}, {to: "vul-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
CSRF는 악성 사이트나 메일이 로그인한 사용자의 브라우저를 속여서, 사용자가 의도하지 않은 요청을 신뢰하는 사이트에 보내게 하는 공격입니다. 브라우저가 세션 쿠키를 포함한 쿠키를 요청에 자동으로 붙여 보내기 때문에, 서버가 사용자가 직접 한 요청과 위조된 요청을 구별하지 못하면 성립합니다. 공격자가 할 수 있는 일은 그 사용자의 권한으로 가능한 동작, 예를 들어 송금이나 비밀번호 변경 같은 상태 변경입니다. 그래서 상태를 바꾸는 요청에 공격자가 알 수 없는 토큰을 요구하는 식으로 막고, GET 요청으로는 상태를 바꾸지 않아야 합니다.

(원저자 자료) OWASP CSRF Prevention Cheat Sheet는 CSRF를 악성 사이트나 메일 등이 인증된 사용자의 브라우저를 속여 신뢰하는 사이트에서 원치 않는 동작을 하게 만드는 공격으로 정의한다. 브라우저 요청에 세션 쿠키를 포함한 모든 쿠키가 자동으로 붙기 때문에, 요청자의 신원과 권한을 확인하는 별도의 도전-응답이 없으면 성립한다고 한다. 공격은 취약한 애플리케이션이 노출한 기능과 사용자의 권한 범위 안에서만 가능하고, 토큰이 없으면 공격자가 유효한 요청을 만들 수 없다는 것이 토큰 방어의 근거라고 한다. 시트는 상태 변경에 GET을 쓰지 말라고 권고한다.
(공식 문서) RFC 6265 8.2절은 서버가 쿠키로 사용자를 인증하면, 원격 당사자가 사용자 에이전트에서 요청을 보내게 할 수 있고 그때 쿠키가 붙기 때문에 취약해진다고 설명한다. 이 문제를 CSRF나 confused deputy라고도 부르며, 쿠키가 ambient authority(환경이 알아서 따라붙는 권한)이기 때문이라고 한다.
