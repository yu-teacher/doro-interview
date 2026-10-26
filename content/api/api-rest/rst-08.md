---
slug: "rst-08"
topic: "api-rest"
tier: BASIC
difficulty: 2
title: "API 에러 응답은 어떤 형식으로 통일하나요? RFC 9457 의 Problem Details 는 무엇인가요?"
keywords: ["application/problem+json", "type·title·status·detail·instance", "type URI가 문제 유형의 식별자", "문제별 확장 멤버", "HTTP 상태 코드와 함께 사용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9457.html", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md", "https://google.aip.dev/193"]
concepts: [http-status-error]
importance: 3
links: [{to: "rst-16", kind: FOLLOWUP}, {to: "mvc-12", kind: RELATED}, {to: "mvc-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
에러 본문의 형식을 팀마다 새로 만들지 않도록 RFC 9457이 정한 Problem Details를 쓰는 방법이 있습니다. 미디어 타입은 `application/problem+json`이고, 문제 유형을 식별하는 `type` URI, 유형별로 고정된 짧은 `title`, HTTP 상태 코드를 알려 주는 `status`, 이번 발생에 대한 설명 `detail`, 발생 건을 가리키는 `instance`를 둡니다. 유효성 오류 목록 같은 정보는 문제 유형이 정의하는 확장 멤버에 담고, 클라이언트는 모르는 확장은 무시합니다. HTTP 상태 코드는 응답 줄에 그대로 쓰고 본문은 그 위에 세부를 더하는 역할입니다. 이 형식이 유일한 방법은 아니고 Microsoft나 Google도 각자 오류 모델을 정해 둡니다.

```
HTTP/1.1 422 Unprocessable Entity
content-type: application/problem+json

{"type":"https://example.com/probs/validation","title":"Your request is not valid.",
 "status":422,"errors":[{"detail":"must be a positive integer","pointer":"#/qty"}]}
```

(공식 문서) RFC 9457 3절은 `application/problem+json` 미디어 타입의 JSON 객체를 정규 모델로 정의한다. 3.1은 `type`(문제 유형을 식별하는 URI 참조, 없으면 `about:blank`), `status`(참고용 HTTP 상태 코드), `title`(유형별 짧은 요약, 발생마다 바뀌지 않아야 함), `detail`(이번 발생에 대한 설명), `instance`(발생을 식별하는 URI 참조)를 정의한다. 3.2는 문제 유형이 확장 멤버를 더할 수 있고 클라이언트는 모르는 확장을 무시해야 한다고 한다. 3절의 유효성 오류 예시는 422 응답에 `errors` 확장을 쓰고, 서로 다른 유형의 문제가 여럿이면 가장 관련 있거나 급한 문제 하나를 표현하라고 권한다. 4절은 문제 세부가 구현 디버깅 도구가 아니라 HTTP 인터페이스에 대한 설명이며, 이미 쓰는 오류 형식이 있으면 그것이 더 적절할 수 있다고 한다.
(원저자 자료) Microsoft REST API Guidelines(비권장 표시 문서) 7.10.2는 OData 기반의 `error` 객체에 `code`, `message`, 선택적 `target`, `details`, `innererror`를 두는 형식을 권하고, `code` 값을 새로 늘리면 클라이언트에 보이는 호환성 문제가 될 수 있어 세부 코드는 `innererror`에 두라고 한다. Google AIP-193은 오류 시 `google.rpc.Status`를 쓰고 모든 오류 응답에 기계가 읽을 수 있는 식별자를 담은 `ErrorInfo`를 넣으라고 한다.
(실험 확인) 위 블록은 Node v24.16.0 으로 만든 연습용 서버가 RFC 9457 3절 예시 모양으로 내도록 구현한 응답을 curl 8.7.1 로 확인한 것이다. 상태 문구는 Node의 상태 사전 값(Unprocessable Entity)이 그대로 나온 것이고, RFC 9110 15.5.21과 RFC 9457 3절 예시는 이 코드를 Unprocessable Content라고 부른다.
