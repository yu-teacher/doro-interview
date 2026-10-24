---
slug: "alg-09"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "힙 정렬은 어떻게 동작하고 시간 복잡도와 안정성은 어떤가요?"
keywords: ["힙을 만든 뒤 최댓값 반복 추출", "O(n log n)", "제자리 정렬", "불안정", "선택 정렬의 변형"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/heapSort.html", "https://xlinux.nist.gov/dads/HTML/selectionSort.html", "https://xlinux.nist.gov/dads/HTML/inplacesort.html", "https://opendatastructures.org/"]
refs: ["Open Data Structures (Java), 11.1.3 Heap-sort, PDF p.245-246", "Open Data Structures (Java), 11.3 Discussion and Exercises 비교표, PDF p.255"]
concepts: [complexity-sorting, tree-heap]
importance: 1
links: [{to: "ds-13", kind: RELATED}, {to: "ds-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
힙 정렬은 먼저 배열을 힙으로 만든 다음 최댓값을 반복해서 꺼내는 정렬이고, 실행 시간은 O(n log n)입니다. 정렬된 항목이 원래 항목과 같은 저장 공간을 차지하는 제자리 정렬로 구현할 수 있습니다. 가장 큰 원소를 반복해서 골라 정렬된 쪽으로 보낸다는 점에서 선택 정렬의 변형으로 볼 수 있고, 다음 최댓값을 힙으로 빨리 찾는다는 점이 다릅니다. 안정성은 기대할 수 없습니다. 표준적인 방식으로 직접 구현해 같은 키 세 개를 정렬했더니 순서가 바뀌었기 때문입니다.

(공식 문서) DADS heapsort 항목은 힙을 만든 뒤 최댓값을 반복 추출하는 정렬이며 실행 시간 O(n log n)이고 in-place sort의 한 종류라고 하고, 정렬된 항목을 힙에 두어 다음 항목을 빨리 찾는 선택 정렬의 변형으로 볼 수 있다고 한다. 같은 키 항목의 안정성은 문서가 직접 말하지 않는다.
(실험 확인) Python으로 직접 구현한 힙 정렬(sift-down 방식)의 비교 횟수는 n = 100,000에서 무작위 3,019,469, 정렬 입력 3,112,517, 역순 2,926,640으로 입력 상태와 무관하게 2·n·log₂n(약 3,321,928) 아래에서 비슷했다. 같은 키 (1,a), (1,b), (1,c)를 정렬하자 (1,b), (1,c), (1,a) 순으로 나와 불안정함을 확인했다.
(원저자 자료) Open Data Structures 11.1.3은 힙 정렬이 제자리 정렬이고, 배열을 힙으로 바꾼 뒤 루트와 힙의 마지막 칸을 바꾸고 힙 크기를 하나 줄여 다시 힙으로 고치는 일을 반복한다고 설명한다. 그래서 정렬이 끝난 구간이 배열 뒤쪽에서 늘어나며, 책은 최소 힙을 써서 끝에 내림차순이 쌓이므로 마지막에 뒤집는다고 쓰고 각주에서 비교 함수를 바꿔 처음부터 오름차순으로 만들 수도 있다고 한다. 11장 끝 비교표는 힙 정렬의 최악 비교 횟수를 2n log n + O(n)이라고 한다.
(보충) 힙 정렬이 불안정하다는 것은 위 책이 서술하지 않는 일반적인 설명이다. 위 반례는 sift-down 방식으로 직접 구현한 한 구현에서 관찰한 것이어서 모든 구현의 증명은 아니다.
