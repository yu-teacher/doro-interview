---
slug: "alg-03"
topic: "cs-algorithm"
tier: BASIC
difficulty: 1
title: "병합 정렬은 어떻게 동작하고, 왜 O(n log n)이며 공간은 얼마나 더 쓰나요?"
keywords: ["분할 후 병합", "재귀 깊이 log n", "단계마다 n번 비교", "추가 공간", "안정 정렬"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://xlinux.nist.gov/dads/HTML/mergesort.html", "https://xlinux.nist.gov/dads/HTML/divideAndConquer.html", "https://jeffe.cs.illinois.edu/teaching/algorithms/", "https://opendatastructures.org/"]
refs: ["Algorithms (Erickson), 1.4 Mergesort, PDF p.45-46", "Algorithms (Erickson), 1.7 Recursion Trees, PDF p.50-51", "Open Data Structures (Java), 11.3 Discussion and Exercises 비교표, PDF p.255"]
concepts: [complexity-sorting, recursion-dp]
importance: 2
links: [{to: "alg-05", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
병합 정렬은 배열을 절반으로 나눠 각각 재귀적으로 정렬한 뒤 정렬된 두 부분을 하나로 합치는 분할 정복이고, 실행 시간은 Θ(n log n)입니다. 절반씩 나누니 재귀 깊이가 약 log₂ n이고, 각 단계에서 합칠 때 원소를 한 번씩만 훑으니 단계당 약 n번 비교하는 셈이라 이 차수가 나옵니다. 기본 구현에서는 입력이 이미 정렬돼 있어도 차수는 같습니다. 합치는 동안 결과를 담을 임시 공간이 필요해서 일반적인 배열 구현은 O(n) 추가 공간을 쓰고, 합칠 때 값이 같으면 왼쪽을 먼저 꺼내면 안정 정렬이 됩니다.

(공식 문서) DADS merge sort 항목은 항목을 두 그룹으로 나눠 각각 재귀 정렬하고 합치는 알고리즘이며 실행 시간이 Θ(n log n)이라고 한다. divide and conquer 항목은 작은 인스턴스로 나눠 재귀로 풀고 해를 합치는 기법이며 merge sort를 그 예로 든다. 문서에는 선형 시간 제자리 병합에 관한 연구가 있다는 언급도 있다.
(실험 확인) Python으로 직접 구현한 위쪽 절반/아래쪽 절반 병합 정렬(합칠 때 `<=`로 왼쪽 우선)에서 무작위 입력의 비교 횟수는 n = 1024에서 8,943(n·log₂n = 10,240), n = 65,536에서 965,600(1,048,576)이었다. 이미 정렬된 입력과 역순 입력은 둘 다 n = 1024에서 5,120번, n = 65,536에서 524,288번으로 (n/2)·log₂n이었고, 차수는 같은 n log n이다.
(원저자 자료) Algorithms(Erickson) 1.4절은 병합 정렬의 Merge가 O(n)이라 T(n) = T(⌈n/2⌉) + T(⌊n/2⌋) + O(n)이 되고, 바닥·천장을 떼어 T(n) = 2T(n/2) + O(n)으로 단순화한 뒤 재귀 트리의 모든 층의 합이 같으면 O(n log n)이 된다고 푼다. 1.7절은 T(n) = r·T(n/c) + f(n) 꼴 트리의 깊이를 밑이 c인 로그 n이라고 하므로, 절반씩 나누는 병합 정렬은 깊이가 log n 꼴이고 층마다 비용이 n 꼴로 같다는 것이 이 풀이의 골격이다. 이 책의 Merge 의사코드는 합친 결과를 길이 n짜리 별도 배열 B에 쓴 뒤 A로 복사한다. Open Data Structures 11장 끝의 비교는 병합 정렬이 제자리 정렬이 아니며 합치는 단계에서 보조 배열을 쓰고, 메모리가 부족하면 그 할당이 실패 지점이 될 수 있다고 쓴다.
(보충) 합칠 때 값이 같으면 왼쪽을 먼저 꺼내면 안정 정렬이 된다는 조건은 이 구현 방식에 대한 일반 설명이며 위 책들에서 직접 확인하지 못했다. O(n) 추가 공간이라는 상한 표기는 위 책들이 보조 배열 사용으로 보일 뿐 그 표기로 직접 서술하지는 않는다.
