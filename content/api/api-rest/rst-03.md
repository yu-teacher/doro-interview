---
slug: "rst-03"
topic: "api-rest"
tier: DEEP
difficulty: 2
title: "JSON 을 HTTP 로 주고받으면 REST API 인가요? 'RESTful' 이라는 말의 오해와 HATEOAS 는 무엇인가요?"
keywords: ["REST는 제약 조건의 집합", "하이퍼미디어로 상태 전이 안내", "JSON과 HTTP 사용만으로는 REST 아님", "리소스 지향 설계와의 구분", "적용한 제약을 구체적으로 설명"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm", "https://ics.uci.edu/~fielding/pubs/dissertation/evaluation.htm", "https://google.aip.dev/121", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/GuidelinesGraph.md"]
concepts: [rest-design]
importance: 2
links: [{to: "rst-01", kind: PREREQ}, {to: "rst-15", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
JSON과 HTTP를 쓴다는 사실만으로 REST라고 할 수는 없습니다. Fielding의 균일 인터페이스에는 하이퍼미디어, 흔히 HATEOAS라 부르는 제약이 들어 있어서, 서버가 응답 표현 안에 다음에 고를 수 있는 상태 전이를 담고 클라이언트는 그것을 따라가며 상태를 옮기는 구조를 말합니다. 실무에서 말하는 REST API는 대개 리소스 중심 URI와 HTTP 메서드를 쓰는 HTTP API이고 이 제약까지는 적용하지 않는 경우가 많습니다. Google의 API 가이드도 자기 방식을 REST에서 원칙을 빌려 온 리소스 지향 설계라고 따로 부릅니다. 그래서 면접에서는 어떤 제약을 어디까지 적용했는지로 설명하는 편이 정확합니다.

(원저자 자료) 논문 5.1.5는 균일 인터페이스의 네 번째 제약으로 애플리케이션 상태 엔진으로서의 하이퍼미디어를 든다. 5.3.3은 REST에서 애플리케이션의 제어 상태가 서버가 돌려준 표현 안에 있고, 모델 애플리케이션은 현재 표현들이 제시하는 상태 전이 중에서 골라 다음 상태로 넘어가는 엔진이라고 설명한다. 5.3.2는 REST가 특정 프로토콜에 통신을 한정하지 않는다고 한다. 내려받은 논문의 5장(`rest_arch_style`)과 6장(`evaluation`) 본문에서 'RESTful'이라는 단어와 성숙도 모델에 대한 서술은 찾지 못했다(검색어 RESTful, maturity). 나머지 장은 읽지 않았다.
(원저자 자료) Google AIP-121은 리소스 지향 설계가 REST와 비슷한 점이 있고 REST의 많은 원칙을 빌려 오면서도 자체 패턴을 따로 정의한다고 밝힌다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시가 붙은 문서)와 Microsoft Graph REST API Guidelines에서는 하이퍼미디어나 HATEOAS를 요구하는 대목을 찾지 못했다(검색어 hypermedia, HATEOAS, hypertext; 비권장 문서의 참고 도서 링크 주소에 hypermedia 단어가 한 번 있을 뿐이다). 읽은 AIP 121·122·134·135·136·154·158·193 페이지에서도 같았다.
(보충) 실무의 많은 API가 링크 제약을 적용하지 않는다는 것은 위 가이드라인 부재에서 이끌어 낸 일반론이며 통계 근거는 없다. 리처드슨 성숙도 모델은 허용된 출처에서 확인하지 못해 다루지 않았다. 이 질문은 개념 설명이라 실험하지 않았다.
