---
slug: "alg-15"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "위상 정렬은 언제 가능하고 어떻게 구하며 사이클은 어떻게 알아채나요?"
keywords: ["DAG에서만 가능", "간선 u→v이면 u가 앞", "진입 차수 0인 정점부터 처리", "사이클이면 일부만 출력", "순서가 유일하지 않음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/topologicalSort.html", "https://xlinux.nist.gov/dads/HTML/topologicalOrder.html", "https://xlinux.nist.gov/dads/HTML/directAcycGraph.html"]
---
**모범 답변 (30~60초)**
위상 정렬은 방향 그래프의 모든 간선 u→v에서 u가 v보다 앞에 오도록 정점을 나열하는 것이고, 사이클이 없는 방향 그래프(DAG)에서만 가능합니다. 대표적인 방법은 진입 차수가 0인 정점을 큐에 넣고 꺼낼 때마다 그 정점의 나가는 간선을 지워 새로 진입 차수가 0이 된 정점을 큐에 넣는 것입니다. 사이클이 있으면 그 정점들은 진입 차수가 끝내 0이 되지 않아서 출력된 정점 수가 전체보다 적어지므로 사이클을 알 수 있습니다. 가능한 순서는 보통 여러 개입니다.

(공식 문서) DADS topological order 항목은 방향 비순환 그래프의 정점에 번호를 매겨 모든 간선 i→j가 i < j를 만족하게 하는 것이라고 정의한다. directed acyclic graph 항목은 시작과 끝이 같은 경로가 없는 방향 그래프라고 정의하고, topological sort 항목은 일부 쌍에 비교가 없는 부분 순서에 따라 항목을 배열하는 것이라고 한다.
(실험 확인) 옷 입기 예시 DAG(7개 정점)에 Kahn 방식(직접 구현)을 돌려 얻은 순서에서 모든 간선 u→v가 u가 앞이었다. 사이클(a→b→c→a)에 정점 d→a를 붙인 그래프는 d만 출력되고 끝나 전체 정점을 출력하지 못했다. a→c, b→c만 있는 그래프의 유효한 순서는 (a,b,c)와 (b,a,c) 두 가지였다.
(보충) DAG에서만 가능하다는 결론(사이클이 있으면 조건을 만족하는 번호 매김이 없다는 추론), 순서가 보통 여러 개라는 설명, 진입 차수로 사이클을 알아채는 방법, 진입 차수를 쓰는 Kahn 방식 자체와 각 정점·간선을 한 번씩 처리하므로 O(V+E)라는 점은 일반적인 알고리즘 설명이며 위 문서는 서술하지 않는다.
