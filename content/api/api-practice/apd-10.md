---
slug: "apd-10"
topic: "api-practice"
tier: DEEP
difficulty: 2
title: "목록 API의 정렬과 필터는 어떻게 설계하고, 어떤 점을 조심해야 하나요?"
keywords: ["필드와 방향을 나열하는 order_by", "지원하지 않는 필드는 오류", "페이지 사이 같은 필터·정렬 유지", "필요가 확인될 때만 추가", "필터, 정렬, 페이징 순서"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://google.aip.dev/132", "https://google.aip.dev/160", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/azure/Guidelines.md", "https://raw.githubusercontent.com/microsoft/api-guidelines/vNext/graph/Guidelines-deprecated.md"]
concepts: [api-pagination]
importance: 2
links: [{to: "apd-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
정렬은 `order_by=created desc,name`처럼 필드와 방향을 쉼표로 나열하게 하고 방향을 생략하면 오름차순으로 둡니다. 필터는 필드마다 파라미터를 늘리기보다 하나의 `filter` 문자열에 구조화된 문법을 쓰라고 AIP-160이 권고합니다. Azure 가이드라인은 지원하지 않는 필드로 정렬하면 조용히 무시하지 말고 오류를 주라고 하고, 같은 목록을 페이지로 넘기는 동안 필터와 정렬은 그대로 쓰라고 합니다. Microsoft 가이드라인은 평가 순서를 필터, 정렬, 페이징으로 정합니다. AIP-132는 정렬과 필터를 확인된 필요가 있을 때만 넣으라고 하는데, 나중에 추가는 쉽지만 제거는 깨지는 변경이기 때문입니다. 정렬은 전체 정렬이 필요해 비싸다는 Azure의 경고가 있으니 허용 필드를 제한하는 편이 좋습니다.

(공식 문서) AIP-132 Ordering 절은 `order_by`를 쉼표로 구분한 필드 목록으로, 내림차순은 ` desc` 접미사로 쓰고 기본은 오름차순이라 하며, 정렬·필터는 확립된 필요가 있을 때만 넣으라고 한다. AIP-160은 필터 요구가 자주 변하므로 구조화된 문법의 `filter` 문자열 하나를 쓰라고 한다. Azure 가이드라인은 `orderby` 지원이 드물고 전체 컬렉션을 정렬해야 해서 구현 비용이 크다고 하고, 지원하지 않는 필드로 정렬하면 오류를 반환하며 지원하지 않는 쿼리 파라미터에도 오류를 반환하라고 하고, 같은 필터·정렬을 모든 페이지에 쓰라고 한다. Microsoft 가이드라인 9.9는 필터, 정렬, 페이징 순서로 평가하라고 한다.
(보충) 허용 정렬 필드를 인덱스가 있는 것으로 제한하라는 조언은 위 비용 경고에서 이끌어낸 일반적인 실무 설명이며 문서가 직접 그렇게 말한 것은 아니다.
(실험하지 않았다) 문서 근거만으로 적었다.
