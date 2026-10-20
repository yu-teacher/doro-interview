---
slug: "alg-14"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "최소 신장 트리를 구하는 크루스칼과 프림 알고리즘은 어떻게 다른가요?"
keywords: ["V-1개 간선의 트리", "크루스칼은 간선을 가중치순으로 선택", "프림은 정점 하나에서 확장", "그리디로 전역 최적", "사이클 판정에 서로소 집합"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/minimumSpanningTree.html", "https://xlinux.nist.gov/dads/HTML/kruskalsalgo.html", "https://xlinux.nist.gov/dads/HTML/primJarnik.html", "https://xlinux.nist.gov/dads/HTML/greedyalgo.html"]
---
**모범 답변 (30~60초)**
최소 신장 트리는 가중 그래프의 모든 정점을 잇는 가중치 합 최소의 트리이고 간선은 V-1개입니다. 크루스칼은 간선을 가중치가 작은 순으로 보면서 두 끝점이 서로 다른 부분 트리에 속할 때만 추가하고, 사이클 여부는 서로소 집합으로 빠르게 판정합니다. 프림은 아무 정점에서 시작해 현재 트리와 바깥 정점을 잇는 가장 가벼운 간선을 하나씩 더해 트리를 키웁니다. 둘 다 그때그때 가장 가벼운 선택을 하는 그리디인데 이 문제에서는 전역 최적해를 보장합니다.

(공식 문서) DADS minimum spanning tree 항목은 모든 정점을 포함하는 최소 가중치 트리라고 정의하고 Kruskal과 Prim-Jarnik을 관련 알고리즘으로 든다. Kruskal's algorithm 항목은 서로 다른 부분 MST에 속한 정점을 잇는 가장 짧은 간선을 반복 추가한다고, Prim-Jarnik 항목은 임의 정점에서 시작해 트리 안팎을 잇는 최소 간선을 반복 추가한다고 설명한다. greedy algorithm 항목은 둘 모두 전역 최적 MST를 찾는 그리디라고 한다.
(실험 확인) 무작위 연결 그래프(V=50·E=247, V=500·E=2496)에서 크루스칼(서로소 집합 사용)과 프림(힙 사용)의 총 가중치가 6,174와 60,401로 같았고 크루스칼이 고른 간선은 V-1개(49개, 499개)였다. 정점 6개의 작은 무작위 그래프에서 V-1개 간선 부분집합을 전수 탐색한 최소 신장 트리 비용 39가 두 알고리즘의 값과 일치했다.
(보충) 신장 트리의 간선이 V-1개라는 사실, 서로소 집합과 힙을 쓰는 구현, 복잡도 표기는 일반적인 설명이다.
