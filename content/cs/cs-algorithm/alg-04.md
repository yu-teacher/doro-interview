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
sources: ["https://xlinux.nist.gov/dads/HTML/quicksort.html", "https://xlinux.nist.gov/dads/HTML/introspectiveSort.html", "https://jeffe.cs.illinois.edu/teaching/algorithms/", "https://opendatastructures.org/"]
refs: ["Algorithms (Erickson), 1.5 Quicksort, PDF p.47-49", "Open Data Structures (Java), 11.1.2 Quicksort, PDF p.242-244"]
concepts: [complexity-sorting, recursion-dp]
importance: 3
links: [{to: "alg-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
퀵 정렬은 피벗을 하나 고르고 나머지를 피벗보다 작은 쪽과 큰 쪽으로 나눈 다음 각 부분을 재귀로 정렬합니다. 보통은 O(n log n)이지만 최악에는 Θ(n²)입니다. 피벗이 계속 한쪽 끝으로 쏠리면 단계마다 원소 하나만 줄기 때문이고, 예를 들어 첫 원소를 피벗으로 쓰면 이미 정렬된 입력이 그런 경우입니다. 피벗을 무작위로 고르면 이런 입력의 영향을 피할 수 있고, 좋은 피벗을 Select로 고르면 최악도 O(n log n)이 되며, 재귀가 너무 깊어지면 힙 정렬로 바꾸는 인트로 정렬도 있습니다. 보통 제자리 정렬로 구현합니다.

(공식 문서) DADS quicksort 항목은 피벗을 고르고 나머지를 작은 쪽·큰 쪽으로 나눈 뒤 재귀 정렬한다고 정의하고, 최악 Θ(n²)이며 보통 O(n log n)이라고 한다. 피벗을 무작위로 고르면 Las Vegas 알고리즘이고 in-place sort의 일종이며, Select로 좋은 피벗을 고르면 최악도 O(n log n)이 된다고 한다. introspective sort 항목은 시간이 이차에 가까워지면 힙 정렬로 넘어가는 변형이라고 정의한다.
(실험 확인) Python으로 직접 구현한 리스트 분할식 퀵 정렬(제자리가 아니라 비교 횟수만 세는 용도, 피벗과 같은 값은 따로 묶음)에서 n = 2000일 때 첫 원소 피벗은 무작위 입력 25,067회, 정렬 입력 1,999,000회(= n(n-1)/2), 역순 입력 1,999,000회였고 무작위 피벗은 각각 25,535, 24,644, 24,177회였다.
(원저자 자료) Algorithms(Erickson) 1.5절은 Partition이 O(n)이고 피벗의 순위를 r이라 할 때 T(n) = T(r-1) + T(n-r) + O(n)이라고 한다. 피벗이 정확히 중앙값이면 2T(n/2) + O(n)이라 O(n log n)이지만, 실제로는 첫 원소나 마지막 원소 같은 단순한 선택을 흔히 쓰고 이때 r은 1부터 n까지 아무 값이나 될 수 있어서, 두 부분이 완전히 쏠리는 최악(r = 1 또는 r = n)에서는 T(n) ≤ T(n-1) + O(n)이 되어 O(n²)이다. 가운데 세 값의 중앙값을 피벗으로 쓰는 방법도 r = 2나 r = n-1이 남아 있어 최악은 여전히 O(n²)이고, 단순 선택보다 실전에서 낫다고는 하며 특히 거의 정렬된 배열에서 그렇다고 쓴다. 1.5절 각주는 피벗 위치를 균등하게 무작위로 고르면 모든 입력 배열에 대해 높은 확률로 O(n log n)이고, 무작위성을 입력이 아니라 알고리즘이 쥐고 있다는 점이 핵심이라고 한다. Open Data Structures 11.1.2는 무작위 피벗 퀵 정렬의 기대 비교 횟수가 많아야 2n ln n + O(n)이고 기대 시간이 O(n log n)이라는 정리를 증명하고 분할이 제자리라고 쓴다.
(보충) 첫 원소를 피벗으로 쓸 때 이미 정렬된 입력이 바로 그 쏠리는 경우라는 구체적 설명은 위 책이 그대로 서술하지 않는다(책은 거의 정렬된 배열에서 단순 선택이 불리하다는 뉘앙스로만 말한다). 위 실험은 그 설명과 맞는 비교 횟수를 확인한 것이다.
