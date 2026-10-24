---
slug: "fwp-01"
topic: "frontend-web-platform"
tier: BASIC
difficulty: 1
title: "브라우저 주소창에 URL 을 입력하면 화면이 보이기까지 어떤 일이 일어나나요?"
keywords: ["주소 요청과 응답 수신", "HTML 파싱으로 DOM 생성", "스타일 계산과 레이아웃", "페인트와 합성", "스크립트가 파싱을 막음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://html.spec.whatwg.org/multipage/parsing.html", "https://html.spec.whatwg.org/multipage/webappapis.html", "https://developer.chrome.com/blog/inside-browser-part2", "https://developer.chrome.com/blog/inside-browser-part3", "https://developer.chrome.com/docs/chromium/renderingng-architecture"]
concepts: [browser-rendering]
importance: 3
links: [{to: "fwp-10", kind: FOLLOWUP}, {to: "fwp-15", kind: FOLLOWUP}, {to: "net-12", kind: RELATED}, {to: "web-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
먼저 브라우저가 입력이 검색어인지 URL인지 판단하고, DNS 조회와 TLS 연결을 거쳐 요청을 보내 응답을 받습니다. 응답이 HTML이면 렌더러가 받아서 파싱해 DOM 트리를 만들고, 그동안 이미지·CSS·스크립트 같은 하위 리소스도 요청합니다. 그다음 CSS를 적용해 요소별 계산된 스타일을 구하고, 레이아웃에서 각 요소의 위치와 크기를 정하고, 페인트로 그리는 순서를 기록한 뒤 합성해서 화면에 픽셀로 내보냅니다. 파싱 중에 일반 `script`를 만나면 그 스크립트를 실행할 때까지 파싱이 멈춘다는 점이 성능에서 중요합니다.

(공식 문서) HTML 표준 13.2.1은 파싱 입력이 코드 포인트 스트림이고 토큰화 단계와 트리 구성 단계를 거쳐 Document 객체를 출력한다고 설명한다. 같은 표준의 이벤트 루프 절은 화면을 갱신할 때 애니메이션 프레임 콜백을 실행한 뒤 스타일 재계산과 레이아웃을 하고 화면 표시를 갱신하는 순서를 적는다. 내가 읽은 범위에서는 페인트와 합성을 단계로 이름 붙여 정의하지 않았고, 아래 단계 구분은 Chrome 문서의 설명이다.
(공식 문서) Chrome for Developers의 "Inside look at modern web browser" 2부는 주소창 입력의 검색어·URL 판별, 네트워크 스레드의 DNS 조회와 TLS 연결, 301 같은 리다이렉트 처리, 응답의 MIME 타입 확인, 렌더러 프로세스로 커밋하는 흐름을 설명한다. 3부는 렌더러가 HTML을 DOM으로 파싱하고, 병렬로 도는 preload scanner가 하위 리소스를 미리 요청하며, `script`를 만나면 파싱이 멈추고, 그다음 스타일 계산, 레이아웃, 페인트 기록, 합성 순서로 진행된다고 설명한다. 이 글들과 RenderingNG 아키텍처 문서(Animate, Style, Layout, Pre-paint, Paint, Commit, Layerize, Raster, Activate, Draw 등의 단계)는 Chrome 구현의 설명이라 다른 브라우저의 세부 구조와 같다는 뜻은 아니다.
