---
slug: "apd-01"
topic: "api-practice"
tier: BASIC
difficulty: 1
title: "목록 API의 페이지 나누기에서 오프셋 방식과 커서(페이지 토큰) 방식은 무엇이 다르고 어떻게 고르나요?"
keywords: ["건너뛸 개수를 주는 오프셋", "다음 위치를 가리키는 토큰", "임의 페이지로 이동", "데이터가 바뀔 때의 일관성", "토큰이 비면 마지막 페이지"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://google.aip.dev/158", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md"]
concepts: [api-pagination]
importance: 3
links: [{to: "apd-09", kind: FOLLOWUP}, {to: "apd-15", kind: FOLLOWUP}, {to: "rst-10", kind: RELATED}, {to: "dbp-06", kind: RELATED}]
---
**모범 답변 (30~60초)**
오프셋 방식은 앞에서 몇 개를 건너뛸지 숫자로 받는 방식이라 3페이지로 바로 가는 식의 임의 이동이 쉽지만, 페이지를 넘기는 사이에 데이터가 추가·삭제되면 같은 항목이 두 번 보이거나 빠질 수 있습니다. 커서 방식은 서버가 돌려준 다음 위치 토큰을 다음 요청에 그대로 보내는 방식으로, 이미 본 지점 다음부터 이어 읽기 때문에 그런 흔들림이 적습니다. 대신 임의 페이지로 점프하기 어렵습니다. Google AIP-158은 요청에 `page_token`, 응답에 `next_page_token`을 두도록 하고, 토큰이 비어 있으면 마지막 페이지라고 정합니다.

(공식 문서) AIP-158은 요청에 `page_size`와 `page_token`, 응답에 `next_page_token`을 두고, 컬렉션 끝에 이르면 `next_page_token`을 비워야 하며 이것이 끝을 알리는 유일한 방법이라고 한다. `skip`은 선택 사항(may)이고 그 값은 페이지 수가 아니라 건너뛸 개별 리소스 수라고 한다. Microsoft REST API Guidelines(지금은 폐기 표시가 붙어 Graph용 문서로 옮겨진 판) 9.8은 서버 주도 페이징은 연속 토큰(`@nextLink`)으로, 클라이언트 주도 페이징은 `$top`·`$skip`으로 하며, 둘 다 안정된 정렬 순서가 전제이고 생성·삭제에 따라 결과가 빠지거나 반복될 수 있다고 한다.
(실험 확인) 12개 항목을 5개씩 읽는 메모리 모형(Node 24)에서 1페이지를 받은 뒤 새 항목이 앞에 들어오자, 오프셋 방식의 2페이지에 1페이지의 마지막 항목(id 8)이 다시 나왔고 마지막으로 본 id 다음부터 읽는 키셋 방식에는 중복이 없었다. 실제 DB가 아니라 배열 모형이다.
(보충) 번호 이동이 필요한 화면은 오프셋, 대량이거나 자주 바뀌는 데이터는 커서가 맞다는 선택 기준은 일반적인 실무 설명이며 문서가 순위를 매긴 것은 아니다.
