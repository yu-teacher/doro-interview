---
slug: "rst-16"
topic: "api-rest"
tier: TRICKY
difficulty: 3
title: "Problem Details 의 type URI 는 실제로 열어 볼 수 있어야 하나요? status 와 detail 은 클라이언트가 어떻게 다뤄야 하나요?"
keywords: ["type URI가 문제 유형의 기본 식별자", "type을 자동으로 역참조하지 않음", "detail 문자열은 파싱하지 않음", "status는 참고용이며 HTTP 상태와 같아야 함", "type 생략 시 about:blank"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://www.rfc-editor.org/rfc/rfc9457.html"]
concepts: [http-status-error]
importance: 1
links: [{to: "rst-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
클라이언트는 `title`이나 `detail` 문장이 아니라 `type` URI를 문제 유형의 기본 식별자로 써야 합니다. `type`이 http URL이면 사람이 읽을 문서를 가리키는 것이 좋지만, 클라이언트는 디버깅 도구 같은 경우가 아니면 이를 자동으로 열지 않는 것이 좋고, 열리지 않는 URI도 허용됩니다. `detail`은 이번 발생에 대한 사람용 설명이라 파싱하지 말고, 필요한 정보는 확장 멤버로 받습니다. `status`는 참고용이지만 서버는 실제 HTTP 상태 코드와 같게 보내야 하고, 중간 장치가 상태를 바꿀 수 있어 둘이 어긋날 위험이 있습니다. `type`을 생략하면 `about:blank`로 간주해 상태 코드 이상의 의미가 없다는 뜻입니다.

(공식 문서) RFC 9457 3.1.1은 소비자가 `type` URI를 문제 유형의 기본 식별자로 써야 하고(MUST), `type`이 없으면 `about:blank`로 가정한다고 한다. `http`나 `https` URI라면 역참조했을 때 사람이 읽을 문서를 제공해야 하지만(SHOULD) 소비자는 개발자에게 정보를 보여 주는 디버깅 도구 같은 경우가 아니면 자동으로 역참조하지 말아야 한다고(SHOULD NOT) 한다. 해석되지 않는 URI(예: tag URI)도 허용되지만 나중에 해석 가능한 URI로 바꾸면 문제 유형의 정체성이 달라져 호환을 깨게 되므로 해석 가능한 URI를 권장한다. 상대 URI는 기준 URI에 따라 다른 곳을 가리켜 혼란을 주므로 절대 URI를 권장한다.
(공식 문서) 3.1.2는 `status`가 참고용이며 생성자는 실제 HTTP 응답에도 같은 상태 코드를 써야 한다(MUST)고 한다. 5절은 이 멤버가 HTTP 상태와 중복되어 둘이 어긋날 수 있다는 점(예: 프록시나 캐시가 상태를 바꾼 경우)과 일반 HTTP 소프트웨어가 이 멤버를 알거나 존중할 가능성이 낮다는 점을 지적한다. 3.1.4는 `detail`이 클라이언트가 문제를 고치도록 돕는 데 초점을 두고 소비자가 정보를 얻으려고 파싱하지 말아야 하며(SHOULD NOT) 확장 멤버가 더 낫다고 한다. 3.1.3은 `title`이 이 문제 유형의 짧은 요약이고 정의를 알 수 없는 사용자용 참고라고 한다. 4.2.1은 `about:blank`가 HTTP 상태 코드 이상의 의미가 없다는 뜻이라고 한다.
이 질문은 문서 근거만 사용했고 실험하지 않았다.
