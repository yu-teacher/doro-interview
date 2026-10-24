---
slug: "vul-04"
topic: "security-web-vuln"
tier: BASIC
difficulty: 2
title: "XSS를 막는 가장 기본적인 방법은 무엇인가요?"
keywords: ["출력 인코딩", "출력 위치별 인코딩", "프레임워크 기본 이스케이프", "textContent 사용", "HTML 허용 시 정제 라이브러리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html"]
concepts: [xss]
importance: 3
links: [{to: "vul-13", kind: FOLLOWUP}, {to: "vul-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
기본은 값을 화면에 내보내는 시점에 위치에 맞게 인코딩하는 것입니다. HTML 본문에 넣을 때는 `<`, `>`, `&`, 따옴표를 엔티티로 바꿔서 코드가 아니라 텍스트로 보이게 합니다. 브라우저가 HTML, 속성, 자바스크립트, URL, CSS를 각각 다르게 해석하므로 위치마다 맞는 인코딩이 필요하고, 그래서 템플릿 엔진의 기본 이스케이프를 쓰고 그것을 우회하는 기능은 조심해서 써야 합니다. 클라이언트에서는 `innerHTML` 대신 `textContent`를 쓰고, 사용자가 HTML을 써야 하는 기능이면 인코딩 대신 정제 라이브러리로 위험한 요소를 걸러 냅니다. CSP나 쿠키 속성은 보조 수단입니다.

```
"<b>hi</b>"          -> &lt;b&gt;hi&lt;/b&gt;
"Johnson & Johnson"  -> Johnson &amp; Johnson
이미 인코딩한 값을 한 번 더 인코딩 -> Johnson &amp;amp; Johnson   (화면에 &amp; 가 그대로 보임)
```

(원저자 자료) OWASP XSS Prevention Cheat Sheet는 사용자가 입력한 그대로 보여 줄 때 출력 인코딩을 권장하고, HTML 본문에는 `&`, `<`, `>`, `"`, `'`를 엔티티로 바꾸는 HTML 엔티티 인코딩을 쓰라고 한다. 브라우저가 HTML, JavaScript, URL, CSS를 다르게 파싱하므로 잘못된 인코딩은 약점을 만들거나 기능을 깰 수 있다고 하며, 프레임워크 기본 인코딩에서 시작하되 `dangerouslySetInnerHTML`, Angular의 `bypassSecurityTrustAs*` 같은 탈출구를 안전하지 않게 쓰면 문제가 생길 수 있다고 설명한다. `textContent`는 HTML 파싱 없이 텍스트 노드를 만든다고 하고, 사용자가 HTML을 쓰는 경우에는 DOMPurify 같은 정제를 OWASP가 권장한다. 정제한 뒤 내용을 수정하면 효과가 사라질 수 있다고도 한다. 같은 시트는 CSP를 주된 방어로 삼지 말라고 하고, 인터셉터나 필터에서 일괄 인코딩하는 방식을 비권장 패턴으로 설명한다.
(원저자 자료) DOM based XSS Prevention Cheat Sheet는 `innerHTML` 같은 DOM 쪽 HTML 갱신에는 HTML 인코딩 뒤 JavaScript 인코딩을 하라고 권고하고, 속성 값을 자바스크립트로 설정할 때 HTML 속성 인코딩까지 하면 이중 인코딩으로 표시가 깨진다는 예를 든다.
(실험 확인) Node.js 24에서 위 다섯 문자 치환 함수를 만들어 실행한 결과가 위 블록이다. 인코딩을 두 번 하면 `&amp;amp;`가 되는 이중 인코딩도 이때 확인했다. 브라우저에서 실행한 것은 아니다.
