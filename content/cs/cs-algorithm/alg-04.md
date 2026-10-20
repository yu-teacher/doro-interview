---
slug: "alg-04"
topic: "cs-algorithm"
tier: BASIC
difficulty: 2
title: "퀵 정렬은 어떻게 동작하고, 최악이 O(n²)인 이유와 피하는 방법은 무엇인가요?"
keywords: ["피벗 기준 분할", "보통 O(n log n)", "정렬된 입력과 첫 원소 피벗", "무작위 피벗", "제자리 정렬"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/quicksort.html", "https://xlinux.nist.gov/dads/HTML/introspectiveSort.html"]
concepts: [complexity-sorting, recursion-dp]
importance: 3
links: [{to: "alg-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
퀵 정렬은 피벗을 하나 고르고 나머지를 피벗보다 작은 쪽과 큰 쪽으로 나눈 다음 각 부분을 재귀로 정렬합니다. 보통은 O(n log n)이지만 최악에는 Θ(n²)입니다. 피벗이 계속 한쪽 끝으로 쏠리면 단계마다 원소 하나만 줄기 때문이고, 예를 들어 첫 원소를 피벗으로 쓰면 이미 정렬된 입력이 그런 경우입니다. 피벗을 무작위로 고르면 이런 입력의 영향을 피할 수 있고, 좋은 피벗을 Select로 고르면 최악도 O(n log n)이 되며, 재귀가 너무 깊어지면 힙 정렬로 바꾸는 인트로 정렬도 있습니다. 보통 제자리 정렬로 구현합니다.

(공식 문서) DADS quicksort 항목은 피벗을 고르고 나머지를 작은 쪽·큰 쪽으로 나눈 뒤 재귀 정렬한다고 정의하고, 최악 Θ(n²)이며 보통 O(n log n)이라고 한다. 피벗을 무작위로 고르면 Las Vegas 알고리즘이고 in-place sort의 일종이며, Select로 좋은 피벗을 고르면 최악도 O(n log n)이 된다고 한다. introspective sort 항목은 시간이 이차에 가까워지면 힙 정렬로 넘어가는 변형이라고 정의한다.
(실험 확인) Python으로 직접 구현한 리스트 분할식 퀵 정렬(제자리가 아니라 비교 횟수만 세는 용도, 피벗과 같은 값은 따로 묶음)에서 n = 2000일 때 첫 원소 피벗은 무작위 입력 25,067회, 정렬 입력 1,999,000회(= n(n-1)/2), 역순 입력 1,999,000회였고 무작위 피벗은 각각 25,535, 24,644, 24,177회였다.
(보충) 쏠리면 단계마다 하나씩 줄어 Θ(n²)이 된다는 이유 설명, 첫 원소 피벗과 정렬된 입력이 그런 경우라는 것, 무작위 피벗이 이를 피한다는 설명은 일반적인 설명이며 문서는 결과(최악 Θ(n²), 보통 O(n log n))만 적는다. 위 실험은 그 설명과 맞는 비교 횟수를 확인한 것이다.
