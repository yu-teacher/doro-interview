---
slug: "rst-18"
topic: "api-rest"
tier: TRICKY
difficulty: 2
title: "복잡한 검색 조건을 GET 요청의 본문(body)에 담아도 되나요?"
keywords: ["GET 본문은 정의된 의미가 없음", "요청 스머글링 위험으로 거부될 수 있음", "중간 장치가 합의를 모를 수 있음", "fetch는 GET 본문을 막음", "긴 조건이나 민감한 값은 POST 검색"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9110.html", "https://fetch.spec.whatwg.org/", "https://google.aip.dev/136", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/GuidelinesGraph.md"]
concepts: [http-protocol]
importance: 1
links: [{to: "web-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
권하지 않습니다. HTTP 표준은 GET 요청의 본문에 일반적으로 정의된 의미가 없고, 요청의 의미나 대상을 바꿀 수 없으며, 일부 구현은 요청 스머글링 위험 때문에 그런 요청을 거부하고 연결을 닫을 수도 있다고 합니다. 미리 합의된 서버가 아니면 GET에 본문을 보내지 말라는 것이 표준의 입장이고, 중간 프록시는 그 합의를 모를 수 있습니다. Fetch 표준은 GET이나 HEAD 요청에 본문을 주면 TypeError를 던지게 해서 `fetch`로는 보낼 수도 없습니다. 조건이 길거나 URL에 드러내면 안 되는 민감한 값이면 POST로 검색을 설계합니다. Google AIP-136과 Microsoft Graph 가이드도 URL 길이 한계 때문에 조회에 POST를 허용하는 방법을 인정합니다.

```
curl -X GET .../items/1 -H 'content-type: application/json' -d '{"x":1}'
    -> 200 (Node 서버가 본문 7바이트를 읽음)
fetch(url, {method: 'GET', body: 'x'})
    -> TypeError: Request with GET/HEAD method cannot have body.
```

(공식 문서) RFC 9110 9.3.1은 GET 요청에 담긴 내용이 일반적으로 정의된 의미가 없고 요청의 의미나 대상을 바꿀 수 없으며 요청 스머글링 공격의 가능성 때문에 일부 구현이 요청을 거부하고 연결을 닫을 수 있다고 한다. 클라이언트는 원 서버가 이런 요청에 목적이 있고 잘 지원할 것임을 미리 알렸을 때가 아니면 GET에 내용을 만들지 말아야 하고(SHOULD NOT), 서버는 사적 합의에 기대지 말아야 한다고 한다. 또 사용자 입력으로 URI를 만드는 조회에서 민감한 데이터가 URI에 노출되고 캐시 이득이 없다면 GET 대신 POST로 내용에 담아 보내는 편이 낫다고 한다.
(공식 문서) Fetch 표준(WHATWG Living Standard)의 Request 생성자 절은 요청 메서드가 `GET` 또는 `HEAD`인데 본문이 null 이 아니면 TypeError 를 던진다고 한다.
(원저자 자료) Google AIP-136은 커스텀 메서드가 데이터를 읽을 때는 GET을 쓰되 요청 페이로드가 URL 크기 한계를 넘을 수 있으면 조회에도 POST를 쓸 수 있다고 한다. Microsoft Graph 가이드는 OData 쿼리 옵션이 길어 URL 한계를 넘을 수 있을 때 `$query` 세그먼트와 함께 POST를 쓰는 방법을 소개한다.
(실험 확인) 위 블록은 curl 8.7.1 이 GET에 본문을 실어 보냈을 때 Node v24.16.0 의 `http` 서버가 본문을 읽었다는 것과, Node 의 `fetch` 가 GET 본문을 TypeError 로 거부한다는 것을 확인한 결과다. 로컬 서버 하나와 클라이언트 두 종류만 본 것이라 다른 프록시나 서버의 동작을 일반화할 수 없다.
