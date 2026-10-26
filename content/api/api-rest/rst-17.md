---
slug: "rst-17"
topic: "api-rest"
tier: TRICKY
difficulty: 3
title: "API 응답은 어떤 요청에서 캐시될 수 있나요? POST 응답도 캐시되나요?"
keywords: ["GET·HEAD 응답이 캐시 대상", "POST는 명시적 신선도와 Content-Location 필요", "대부분의 캐시는 GET·HEAD만 지원", "Authorization 요청은 공유 캐시 저장 제한", "성공한 쓰기 요청은 대상 URI 캐시 무효화"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://www.rfc-editor.org/rfc/rfc9111.html", "https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm"]
concepts: [http-protocol, cache]
importance: 1
links: [{to: "web-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
HTTP가 캐시 의미를 정의한 메서드는 GET, HEAD, POST이고, 실제 캐시 구현은 대부분 GET과 HEAD만 지원합니다. POST 응답은 명시적인 신선도 정보와 POST 대상 URI와 같은 `Content-Location`이 있을 때만 캐시될 수 있고, 그 캐시본은 이후 GET이나 HEAD에만 재사용됩니다. 공유 캐시는 요청에 `Authorization`이 있으면, 응답이 공유 캐싱을 명시적으로 허용하지 않는 한 저장하지 않습니다. 그리고 PUT, POST, DELETE가 성공하면 캐시는 그 대상 URI의 저장본을 무효화해야 합니다. 그래서 캐시의 혜택을 받으려면 읽기 동작을 GET으로 설계하는 것이 기본입니다.

(공식 문서) RFC 9110 9.2.3은 이 명세가 GET, HEAD, POST의 캐시 의미를 정의하지만 압도적 다수의 캐시 구현은 GET과 HEAD만 지원한다고 한다. 9.3.3은 POST 응답이 명시적인 신선도 정보와 POST의 대상 URI와 같은 값의 `Content-Location` 헤더가 있을 때만 캐시될 수 있고, 캐시된 POST 응답은 이후 GET이나 HEAD를 만족시킬 수 있지만 POST 요청을 만족시킬 수는 없다고 한다. 9.3.1은 GET 응답이 캐시 가능하다고 한다. 9.3.4는 PUT 응답이 캐시 불가이고 성공한 PUT이 같은 대상 URI의 저장본을 무효화한다고 한다.
(공식 문서) RFC 9111 3절은 공유 캐시가 요청에 `Authorization`이 있으면 응답이 공유 캐싱을 명시적으로 허용하는 지시자를 갖지 않는 한 저장해서는 안 된다고 하고, 저장하려면 `public`, `max-age`, `Expires` 같은 명시적 만료·공개 지시나 휴리스틱 캐시 가능 상태 코드 중 하나가 있어야 한다고 한다. 4.4는 PUT, POST, DELETE 같은 안전하지 않은 메서드가 오류 아닌 응답을 받으면 캐시가 대상 URI를 무효화해야 하고(MUST), `Location`과 `Content-Location`의 URI는 무효화 후보라고 한다.
(원저자 자료) Fielding 논문 5.2.2는 기본적으로 조회 요청의 응답은 캐시 가능하고 다른 요청의 응답은 캐시 불가이며, 인증이 있는 요청이나 공유 불가 표시가 있으면 비공유 캐시만 저장할 수 있고, 제어 데이터로 이 기본을 덮어쓸 수 있다고 한다.
이 질문은 문서 근거만 사용했고 실험하지 않았다. 캐시 서버나 프록시를 쓸 수 없어 캐시 동작은 직접 확인하지 못했다.
