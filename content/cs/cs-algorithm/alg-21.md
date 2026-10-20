---
slug: "alg-21"
topic: "cs-algorithm"
tier: TRICKY
difficulty: 3
title: "P, NP, NP-완전, NP-난해는 각각 무엇이고 근사 알고리즘은 왜 쓰나요?"
keywords: ["다항 시간 검증", "NP-완전", "NP-난해", "P vs NP 미해결", "근사 알고리즘의 성능 보장"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/np.html", "https://xlinux.nist.gov/dads/HTML/npcomplete.html", "https://xlinux.nist.gov/dads/HTML/nphard.html", "https://xlinux.nist.gov/dads/HTML/approximatin.html", "https://xlinux.nist.gov/dads/HTML/travelingSalesman.html", "https://xlinux.nist.gov/dads/HTML/knapsackProblem.html"]
concepts: [complexity-sorting]
importance: 1
links: [{to: "alg-01", kind: PREREQ}]
---
**모범 답변 (30~60초)**
NP는 답이 주어졌을 때 그 답이 맞는지를 입력 크기의 다항 시간 안에 검사할 수 있는 결정 문제의 집합이고, 빨리 찾을 수 있다는 뜻은 아닙니다. NP-완전은 NP에 속하면서 다른 모든 NP 문제가 이 문제만큼 쉽다고 환원되는 가장 어려운 문제들이어서, 하나라도 빠르게 풀면 NP 전체가 풀립니다. NP-난해는 NP 문제를 푸는 것 이상으로 어려운 문제로, NP-완전인 결정 문제의 최적화 버전인 최단 순회 경로 찾기가 예입니다. 빠른 정확한 해법이 알려지지 않았기에 다항 시간에 최적에 가까운 보장된 해를 구하는 근사 알고리즘을 씁니다.

(공식 문서) DADS NP 항목은 답을 다항 시간에 검증할 수 있는 결정 문제의 복잡도 부류이며 빨리 찾는다는 뜻은 아니라고 하고 해밀턴 순환의 예를 든다. NP-complete 항목은 NP이면서 다른 어떤 NP 문제도 다항식 배 넘게 어렵지 않은 문제이고, 이 문제의 빠른 알고리즘이 있으면 모든 NP 문제를 빨리 풀 수 있다고 하며 SAT·외판원·배낭 등을 예로 든다. NP-hard 항목은 결정 문제가 NP-완전일 때 최적화 버전은 NP-hard라고 한다. approximation algorithm 항목은 최적화 문제를 입력 길이의 다항 시간에 풀되 최적에 가까움을 보장하는 알고리즘이라 하고, traveling salesman 항목은 삼각 부등식이 성립하면 MST를 이용한 근사 해를 빠르게 얻을 수 있다고 한다. knapsack 항목은 0-1 배낭의 결정 문제가 NP-완전이라고 한다.
(실험 확인) 부분집합 합 결정 문제에서 해가 없는 입력으로 부분집합을 전수 탐색하면 n = 10, 16, 20에서 각각 1,024, 65,536, 1,048,576개로 2ⁿ개를 확인해야 했다(Python 3.14.0). 정점 덮개 문제의 극대 매칭 2-근사(최대 정점 9개, 무작위 300개 그래프)는 전수 탐색 최적 대비 비율의 최댓값이 2.0이었고 한 번도 2를 넘지 않았다.
(보충) NP-완전 문제에 빠른 정확한 해법이 알려져 있지 않다는 점(문서는 "as far as we know" 수준으로만 말한다), P vs NP가 미해결이라는 점, 환원의 정의, 정점 덮개 2-근사 설명은 일반 지식이다. 부분집합 합 실험은 전수 탐색이 지수적임을 보인 것일 뿐 더 빠른 알고리즘이 없다는 증명은 아니다.
