---
slug: "rst-15"
topic: "api-rest"
tier: DEEP
difficulty: 2
title: "Link 헤더와 링크 관계(rel)는 무엇이고 API 에서 페이지네이션 등에 어떻게 쓰나요?"
keywords: ["링크는 출처·관계 유형·대상으로 구성", "Link 헤더의 rel 값", "next·prev 같은 등록된 관계", "관계 유형은 미디어 타입과 다름", "본문 링크나 토큰 방식도 흔함"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm", "https://www.rfc-editor.org/rfc/rfc8288.html", "https://www.iana.org/assignments/link-relations/link-relations.xhtml", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://google.aip.dev/158"]
concepts: [http-protocol, api-pagination]
importance: 1
links: [{to: "rst-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
RFC 8288은 링크를 출처, 관계 유형, 대상 URI, 선택적 속성으로 이루어진 연결로 정의하고, 이를 HTTP 헤더로 전달하는 `Link` 필드를 정합니다. 예를 들어 `Link: <https://api.example.com/items?page=3>; rel="next"`는 이 응답의 다음 페이지가 그 URI라는 뜻이고, `next`, `prev`, `first`, `last` 같은 관계 이름은 IANA 레지스트리에 등록되어 있습니다. 관계 유형은 응답 본문의 형식인 미디어 타입과 다른 개념입니다. 다음 링크를 본문에 넣는 방식도 있어서 Microsoft 가이드는 `@nextLink`를 쓰고, Google AIP-158은 URL 대신 불투명한 `next_page_token`을 씁니다. 링크를 따라가는 구조는 Fielding의 하이퍼미디어 제약과 이어진다고 볼 수 있습니다.

(공식 문서) RFC 8288 2절은 링크가 링크 컨텍스트, 링크 관계 유형, 링크 대상, 선택적 대상 속성으로 이루어진다고 하고, 관계 유형은 미디어 타입과 혼동하면 안 되며 링크를 따라가 얻는 표현의 형식을 알려 주지 않는다고 한다. 관계 유형은 등록된 것과 URI 형태의 확장이 있고, 확장 관계 URI는 서버 부담을 피하려고 클라이언트가 자동으로 접근하지 말아야 한다(SHOULD NOT)고 한다. 3절은 `Link` 헤더 문법과 `rel`, `anchor`, `title`, `type` 등 매개변수를 정의하고, 3.5의 예시에서 `rel="previous"`와 `rel="next"` 링크를 한 헤더에 함께 보낸다.
(공식 문서) IANA 링크 관계 레지스트리에는 `next`와 `prev`(참조는 HTML 사양), `first`와 `last`(참조는 RFC 8288)가 등록되어 있다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시 문서) 9.8.1은 서버 주도 페이징 응답 본문에 불투명한 `@nextLink`를 넣는 예를 든다. Google AIP-158은 응답에 `next_page_token` 문자열을 두고 URL이 아닌 토큰을 쓴다.
(원저자 자료) Fielding 논문 5.3.3은 애플리케이션이 현재 표현들이 제시하는 상태 전이 중에서 골라 다음 상태로 넘어간다고 설명한다.
(보충) 링크로 전이를 알리는 구조가 위 설명과 이어진다는 것은 두 자료를 연결한 내 해석이며, 논문이 `Link` 헤더를 직접 언급한 것은 아니다.
이 질문은 문서 근거만 사용했고 실험하지 않았다. 위 `Link` 예시의 URI는 설명용으로 만든 것이다.
