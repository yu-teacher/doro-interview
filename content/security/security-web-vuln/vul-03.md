---
slug: "vul-03"
topic: "security-web-vuln"
tier: BASIC
difficulty: 1
title: "XSS는 무엇이고, 저장형·반사형·DOM 기반은 어떻게 다른가요?"
keywords: ["피해자 브라우저에서 스크립트 실행", "저장형", "반사형", "DOM 기반", "클라이언트 쪽 안전하지 않은 처리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html", "https://owasp.org/www-community/attacks/xss/"]
concepts: [xss]
importance: 3
links: [{to: "vul-04", kind: FOLLOWUP}, {to: "vul-13", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
XSS는 공격자가 넣은 내용이 웹 페이지에 끼어들어 피해자의 브라우저에서 스크립트로 실행되는 취약점이고, 계정 사칭이나 정보 탈취로 이어질 수 있습니다. 저장형은 입력이 DB 같은 곳에 저장돼 이후 그 페이지를 보는 모든 사람에게 실행되는 경우이고, 반사형은 요청에 담긴 값이 곧바로 응답에 되돌아와 실행되는 경우입니다. DOM 기반은 서버가 아니라 클라이언트의 자바스크립트가 `innerHTML` 같은 위험한 싱크에 값을 넣어서 생깁니다. 다만 OWASP는 저장형·반사형은 페이로드가 피해자에게 도달하는 경로, 서버 쪽·클라이언트 쪽은 안전하지 않게 처리되는 위치에 따른 구분이라 서로 겹칠 수 있다고 설명합니다.

(원저자 자료) OWASP XSS Prevention Cheat Sheet는 XSS라는 이름이 본래 교차 사이트 데이터 탈취에서 나왔지만 지금은 거의 모든 콘텐츠 주입을 가리키는 말이 됐다고 하고, 계정 사칭, 사용자 행동 관찰, 외부 콘텐츠 로딩, 민감 정보 탈취로 이어질 수 있다고 한다. DOM based XSS Prevention Cheat Sheet는 흔히 쓰는 겹치는 분류로 반사형·저장형과 DOM 기반을 들고, 저장형과 반사형은 페이로드가 피해자에게 도달하는 방식, 서버 쪽과 클라이언트 쪽은 신뢰할 수 없는 데이터를 안전하지 않게 다루는 위치를 설명한다고 밝힌다. 같은 문서는 DOM 기반 XSS가 안전하지 않은 클라이언트 쪽 처리에서 생기며, `innerHTML`·`outerHTML`·`document.write`를 위험한 HTML 메서드로 예시한다.
(원저자 자료) 위 두 시트에는 저장형·반사형을 따로 정의한 문장이 없어서 OWASP 커뮤니티의 XSS 문서를 더 읽었다. 이 문서는 반사형을 주입된 스크립트가 웹 서버에서 되비쳐 오는 경우(요청에 담긴 입력을 포함한 에러 메시지나 검색 결과 등)로, 저장형을 주입된 스크립트가 대상 서버(데이터베이스, 게시판, 댓글 등)에 저장되어 피해자가 그 정보를 요청할 때 받는 경우로 설명한다. DOM 기반은 별도 유형으로 소개하고, OWASP가 권장하는 분류는 저장형·반사형 대 서버 쪽·클라이언트 쪽의 행렬이며 DOM 기반은 클라이언트 쪽 XSS의 부분집합이라고 한다.
