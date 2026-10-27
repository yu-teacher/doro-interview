---
slug: "vul-01"
topic: "security-web-vuln"
tier: BASIC
difficulty: 1
title: "OWASP Top 10은 무엇이고, 2021년 판에는 어떤 항목이 있나요?"
keywords: ["웹 보안 위험 인식 문서", "폭넓은 합의", "A01 접근 제어 실패", "A03 인젝션", "A10 SSRF"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://owasp.org/Top10/2021/", "https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/index.html", "https://owasp.org/Top10/2021/A03_2021-Injection/index.html", "https://owasp.org/Top10/2021/A04_2021-Insecure_Design/index.html", "https://owasp.org/Top10/2021/A10_2021-Server-Side_Request_Forgery_(SSRF)/index.html"]
concepts: [web-security]
importance: 2
links: [{to: "vul-02", kind: FOLLOWUP}, {to: "vul-09", kind: FOLLOWUP}, {to: "vul-07", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
OWASP Top 10은 웹 애플리케이션 개발자를 위한 표준적인 보안 인식 문서로, 가장 심각한 웹 보안 위험에 대한 폭넓은 합의를 정리한 목록입니다. 2021년 판은 A01 접근 제어 실패, A02 암호화 실패, A03 인젝션, A04 안전하지 않은 설계, A05 보안 설정 오류, A06 취약하거나 오래된 구성요소, A07 식별·인증 실패, A08 소프트웨어·데이터 무결성 실패, A09 로깅·모니터링 실패, A10 SSRF입니다. 접근 제어 실패가 1위이고, 인젝션에는 SQL 인젝션뿐 아니라 XSS도 포함됩니다. 개별 취약점 하나하나가 아니라 위험 범주의 묶음이라는 점을 기억하면 됩니다.

(원저자 자료) OWASP Top 10:2021 첫 페이지는 이 문서를 개발자와 웹 애플리케이션 보안을 위한 표준 인식 문서로, 가장 중요한 웹 애플리케이션 보안 위험에 대한 폭넓은 합의를 나타낸다고 소개하고 위 10개 항목을 나열한다. A01 페이지는 접근 제어 실패가 5위에서 올라왔다고 하고, A03 페이지는 인젝션이 3위로 내려왔으며 대표 CWE로 CWE-79(XSS)와 CWE-89(SQL 인젝션)를 든다. A04 페이지는 이 범주가 2021년에 새로 생겼고 설계·아키텍처 결함을 다룬다고 하며, A10 페이지는 SSRF 범주가 Top 10 커뮤니티 설문을 통해 추가됐다고 하고, 각 항목 페이지는 여러 CWE를 묶어 매핑한다.
(원저자 자료) 2026-10-24에 `owasp.org/Top10/`을 열어 보니 2025년 판으로 안내하는 페이지로 넘어갔고, 2021년 판 본문은 `/Top10/2021/` 아래에 있다. 이 질문은 2021년 판 기준이며 2025년 판의 내용은 읽지 않았다.
