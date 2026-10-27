---
slug: "alg-12"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "동적 계획법을 쓸 수 있는 문제의 조건은 무엇이고 분할 정복과는 어떻게 다른가요?"
keywords: ["겹치는 부분문제", "최적 부분 구조", "분할 정복은 부분문제가 독립", "서로 다른 부분문제 수"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/dynamicprog.html", "https://xlinux.nist.gov/dads/HTML/principle.html", "https://xlinux.nist.gov/dads/HTML/divideAndConquer.html", "https://xlinux.nist.gov/dads/HTML/memoize.html", "https://xlinux.nist.gov/dads/HTML/knapsackProblem.html", "https://jeffe.cs.illinois.edu/teaching/algorithms/"]
refs: ["Algorithms (Erickson), 1.6 The Pattern (divide and conquer), PDF p.49", "Algorithms (Erickson), 3.3 Interpunctio Verborum Redux, PDF p.123", "Algorithms (Erickson), 3.4 The Pattern: Smart Recursion, PDF p.123-125", "Algorithms (Erickson), 3.8 Subset Sum, PDF p.134-135"]
concepts: [recursion-dp]
importance: 2
links: [{to: "alg-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
동적 계획법은 같은 부분문제가 여러 번 반복해서 나타나는 겹치는 부분문제와, 전체 최적해가 부분문제의 최적해로 만들어지는 최적 부분 구조가 있을 때 씁니다. 분할 정복도 문제를 작게 나눠 풀고 합치지만 부분문제가 서로 겹치지 않는 경우가 많아서 저장해 봐야 이득이 없습니다. 그래서 병합 정렬에는 메모가 소용없고 피보나치에는 효과가 큽니다. 계산량은 서로 다른 부분문제의 수에 부분문제당 전이 비용을 곱해 어림합니다. 0-1 배낭은 부분집합 2ⁿ개를 보는 대신 표 칸 수만큼으로 줄어듭니다.

(공식 문서) DADS dynamic programming 항목은 부분문제 해를 캐시해 최적화 문제를 푸는 기법이라 하고 principle of optimality를 관련 항목으로 든다. principle of optimality 항목은 일부 최적화 문제에서 전역 최적해의 구성 요소도 전역 최적이라고 정의한다. divide and conquer 항목은 문제를 더 작은 인스턴스로 나눠 재귀로 풀고 합치는 기법이라고 한다. memoization 항목은 같은 인자로 fib가 반복 계산돼 지수 시간이 된다고 한다. knapsack problem 항목은 0-1 배낭의 정의와 결정 문제가 NP-완전이라는 점을 설명한다.
(실험 확인) fib(25)는 호출 150,049번에 서로 다른 인자가 25개뿐이었고, n = 1024 병합 정렬의 재귀 호출은 2,047번에 서로 다른 (lo, hi) 구간이 2,047개로 겹침이 없었다. 무작위 배낭 15개(용량 60)에서 부분집합 32,768개를 전수 탐색한 최적값과 DP(표 15×61 = 915칸)의 값이 359로 같았다.
(원저자 자료) Algorithms(Erickson) 1.6절은 분할 정복이 문제를 서로 독립인 더 작은 인스턴스로 나누는 패턴이라고 정의하고, 3.3절은 단어 분할 문제에서 재귀가 O(2ⁿ)번 IsWord를 부르지만 서로 다른 호출은 인자가 n개 값 중 하나일 뿐이라 메모하면 O(n²)번으로 줄어든다고 보인다. 3.4절은 서로 다른 부분문제의 수가 메모 구조의 공간을 정하고 전체 시간은 모든 부분문제의 시간을 합해 구한다고 하며, 동적 계획법을 반복 없는 재귀라고 한다. 3.8절은 부분집합 합을 n과 T의 곱 크기 표 O(nT) 시간으로 풀어 O(2ⁿ) 재귀를 줄이지만 T가 2ⁿ보다 훨씬 크면 오히려 느리다고 덧붙인다.
(보충) "겹치는 부분문제"와 "최적 부분 구조"라는 조건 이름은 위 책이 쓰지 않는 용어이고, 0-1 배낭 자체의 표 칸 수 설명은 책에 없다(책은 배낭의 특수한 경우인 부분집합 합을 다룬다). 전수 탐색과 DP의 값이 같다는 것은 이 한 인스턴스의 확인일 뿐 정확성 증명은 아니다.
