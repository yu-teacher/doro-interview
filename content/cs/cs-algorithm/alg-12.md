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
sources: ["https://xlinux.nist.gov/dads/HTML/dynamicprog.html", "https://xlinux.nist.gov/dads/HTML/principle.html", "https://xlinux.nist.gov/dads/HTML/divideAndConquer.html", "https://xlinux.nist.gov/dads/HTML/memoize.html", "https://xlinux.nist.gov/dads/HTML/knapsackProblem.html"]
concepts: [recursion-dp]
importance: 2
links: [{to: "alg-19", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
동적 계획법은 같은 부분문제가 여러 번 반복해서 나타나는 겹치는 부분문제와, 전체 최적해가 부분문제의 최적해로 만들어지는 최적 부분 구조가 있을 때 씁니다. 분할 정복도 문제를 작게 나눠 풀고 합치지만 부분문제가 서로 겹치지 않는 경우가 많아서 저장해 봐야 이득이 없습니다. 그래서 병합 정렬에는 메모가 소용없고 피보나치에는 효과가 큽니다. 계산량은 서로 다른 부분문제의 수에 부분문제당 전이 비용을 곱해 어림합니다. 0-1 배낭은 부분집합 2ⁿ개를 보는 대신 표 칸 수만큼으로 줄어듭니다.

(공식 문서) DADS dynamic programming 항목은 부분문제 해를 캐시해 최적화 문제를 푸는 기법이라 하고 principle of optimality를 관련 항목으로 든다. principle of optimality 항목은 일부 최적화 문제에서 전역 최적해의 구성 요소도 전역 최적이라고 정의한다. divide and conquer 항목은 문제를 더 작은 인스턴스로 나눠 재귀로 풀고 합치는 기법이라고 한다. memoization 항목은 같은 인자로 fib가 반복 계산돼 지수 시간이 된다고 한다. knapsack problem 항목은 0-1 배낭의 정의와 결정 문제가 NP-완전이라는 점을 설명한다.
(실험 확인) fib(25)는 호출 150,049번에 서로 다른 인자가 25개뿐이었고, n = 1024 병합 정렬의 재귀 호출은 2,047번에 서로 다른 (lo, hi) 구간이 2,047개로 겹침이 없었다. 무작위 배낭 15개(용량 60)에서 부분집합 32,768개를 전수 탐색한 최적값과 DP(표 15×61 = 915칸)의 값이 359로 같았다.
(보충) "겹치는 부분문제"와 "최적 부분 구조"라는 조건 이름, 분할 정복은 부분문제가 겹치지 않는 경우가 많다는 구분, 계산량 어림 방식, 0-1 배낭이 표 칸 수로 줄어든다는 설명은 일반적인 알고리즘 설명이며 위 문서가 직접 서술하지 않는다. 전수 탐색과 DP의 값이 같다는 것은 이 한 인스턴스의 확인일 뿐 정확성 증명은 아니다.
