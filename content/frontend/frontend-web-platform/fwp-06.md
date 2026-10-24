---
slug: "fwp-06"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "동일 출처 정책에서 '출처(origin)' 는 무엇으로 정해지나요?"
keywords: ["스킴·호스트·포트", "하나라도 다르면 다른 출처", "서브도메인도 다른 출처", "경로는 출처에 포함되지 않음", "다른 출처의 응답 읽기는 기본 차단"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://html.spec.whatwg.org/multipage/browsers.html", "https://www.rfc-editor.org/rfc/rfc6454.html"]
concepts: [cors-sop]
importance: 3
links: [{to: "fwp-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
출처는 URL의 스킴, 호스트, 포트의 조합이고, 셋이 모두 같아야 같은 출처입니다. 그래서 `https://example.com`과 `http://example.com`은 스킴이 달라서, `example.com`과 `www.example.com`은 호스트가 달라서, `:8443` 같은 다른 포트도 다른 출처입니다. 경로는 출처에 들어가지 않습니다. 출처가 다르면 브라우저는 한쪽의 스크립트가 다른 쪽의 정보를 읽는 것을 기본적으로 막는데, 스크립트 실행·이미지 표시처럼 읽지 않고 가져다 쓰는 것은 허용되고, 서버가 읽기를 허락하는 방법의 대표적인 예가 CORS입니다.

```
node v24.16.0, new URL(...).origin 비교 (기준 https://example.com)
https://example.com/a/b?x=1   https://example.com          same
https://example.com:443/      https://example.com          same   (기본 포트는 생략)
https://example.com:8443/     https://example.com:8443     different
http://example.com/           http://example.com           different
https://www.example.com/      https://www.example.com      different
```

(공식 문서) HTML 표준의 same origin 정의는 두 출처가 튜플 출처일 때 스킴과 포트가 같고 호스트가 같으면 true를 돌려준다고 한다. RFC 6454 3.2.1은 `http://example.com/`과 `http://example.com:80/`·`http://example.com/path/file`을 같은 출처로, 포트 8080이거나 `www.`가 붙었거나 `https`인 URL은 다른 출처로 예시한다. 3.4.2는 다른 출처의 정보를 읽는 것은 일반적으로 금지되지만 스크립트 실행·이미지 표시·스타일 시트 적용은 허용되며, 리소스가 CORS 같은 방법으로 다른 출처의 읽기를 허용할 수 있다고(예시로 CORS 를 든다) 설명한다.
(실험 확인) 위 블록은 Node v24.16.0의 WHATWG `URL`로 `origin`을 직렬화해 비교한 결과다. 기본 포트가 생략돼 같은 출처로 나오는 것까지 확인했고, 이는 URL 파서의 동작이지 브라우저의 접근 통제를 실행한 것은 아니다.
