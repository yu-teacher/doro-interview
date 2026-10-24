---
slug: "fwp-20"
topic: "frontend-web-platform"
tier: TRICKY
difficulty: 3
title: "`SameSite=Lax` 쿠키를 쓰면 CSRF 가 완전히 막히나요?"
keywords: ["Strict는 같은 사이트 요청에만 전송", "Lax는 안전한 메서드의 최상위 이동에 허용", "None은 교차 사이트 요청에도 전송", "Lax는 CSRF 전반의 견고한 방어가 아님", "다른 CSRF 방어와 함께 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html"]
concepts: [cookie, csrf]
importance: 2
links: [{to: "fwp-12", kind: PREREQ}, {to: "vul-18", kind: RELATED}, {to: "vul-05", kind: RELATED}, {to: "sec-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. `SameSite`는 쿠키를 같은 사이트에서 시작된 요청에만 붙일지를 정하는 속성입니다. `Strict`는 다른 사이트에서 시작된 요청에 붙이지 않고, `Lax`는 여기에 더해 `GET` 같은 안전한 메서드를 쓰는 최상위 이동에는 붙이며, `None`은 교차 사이트 요청에도 붙입니다. `Lax`는 `POST` 같은 안전하지 않은 메서드를 이용한 CSRF에는 어느 정도 심층 방어가 되지만, 쿠키 정의 초안은 새 창을 띄우거나 최상위 이동을 일으켜 같은 사이트 요청을 만들 수 있어서 CSRF 전반에 대한 견고한 방어는 아니라고 설명합니다. 그래서 세션 관리 방식이나 CSRF 토큰 같은 서버 쪽 방어와 함께 쓰라고 권합니다.

(공식 문서) 이 질문은 IETF의 인터넷 초안(draft-ietf-httpbis-rfc6265bis, 2026년 10월판)에 근거하며, 진행 중인 초안이라 최종 표준과 다를 수 있다. 4.1.2.7은 `SameSite`가 쿠키를 같은 사이트 요청에만 붙이게 하고, `Strict`는 같은 사이트 요청에만, `Lax`는 같은 사이트 요청과 교차 사이트 최상위 이동에, `None`은 둘 다에 보낸다고 한다. 5.6.7.1은 `Lax`가 안전한 HTTP 메서드를 쓰는 최상위 이동에 한해 쿠키를 허용하는 예외를 둔 방식이며, `POST` 같은 안전하지 않은 메서드를 이용하는 CSRF에는 심층 방어가 되지만 CSRF 전반에 견고한 방어는 아니라고 한다. 공격자가 새 창을 띄우거나 최상위 이동을 일으켜 같은 사이트 요청을 만들 수 있고 이는 속도 방해물에 지나지 않는다고 설명하며, 8.8.1은 `SameSite`가 사이트 방어의 전부가 되지 않도록 하는 것이 신중하다고 하고, CSRF 토큰 같은 서버 쪽 방어를 함께 쓰도록 강하게 권장하며(Strict 모드는 견고한 방어라고 평가한다), 5.6.7.1은 세션 관리 방식으로 더 완전히 완화할 수 있다고 적는다.
(공식 문서) 같은 초안의 5.6.7과 쿠키 검색 절차는 `SameSite` 속성이 없으면 same-site-flag를 Default로 두고, 교차 사이트 요청에서 쿠키를 보낼지 판단할 때 Default를 Lax와 같은 조건(안전한 메서드의 최상위 이동)으로 취급한다. 8.8.6은 Lax를 기본 동작으로 적용하기 어렵다는 구현 경험도 적는다. 실제 브라우저가 속성 생략 시 어떻게 동작하는지는 이 초안이 아니라 각 브라우저 문서로 확인해야 하며 여기서는 확인하지 못했다.
