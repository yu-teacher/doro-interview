---
slug: "alg-13"
topic: "cs-algorithm"
tier: DEEP
difficulty: 2
title: "다익스트라와 벨만-포드는 무엇이 다르고 각각 언제 쓰나요?"
keywords: ["단일 출발점 최단 경로", "음수 가중치 허용 여부", "음수 사이클 검출", "우선순위 큐", "벨만-포드 O(VE)"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://xlinux.nist.gov/dads/HTML/dijkstraalgo.html", "https://xlinux.nist.gov/dads/HTML/bellmanford.html", "https://xlinux.nist.gov/dads/HTML/shortestpath.html", "https://jeffe.cs.illinois.edu/teaching/algorithms/"]
refs: ["Algorithms (Erickson), 8.6 Best-First: Dijkstra's Algorithm, PDF p.302-307"]
concepts: [graph-algorithms]
importance: 2
links: [{to: "alg-20", kind: FOLLOWUP}, {to: "ds-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
둘 다 한 출발점에서 다른 모든 정점까지의 최단 경로를 구하는 알고리즘입니다. 다익스트라는 가중치가 모두 음이 아니어야 하고, 아직 확정되지 않은 정점 중 거리가 가장 짧은 것을 우선순위 큐로 골라 확정해 가는 그리디 방식입니다. 벨만-포드는 음수 가중치도 되고, 모든 간선을 V-1번 완화한 뒤 한 번 더 확인해서 음수 사이클이 있으면 알려 주고 시간은 O(VE)입니다. 그래서 음수 간선이 없으면 다익스트라, 있거나 음수 사이클 검출이 필요하면 벨만-포드를 씁니다.

(공식 문서) DADS Dijkstra's algorithm 항목은 가중 방향 그래프의 한 출발점에서 모든 정점까지의 최단 경로를 구하며 모든 가중치가 음이 아니어야 한다고 하고, 우선순위 큐를 단순 구현하면 O(V²), 피보나치 힙을 쓰면 O(E + V log V)라고 한다. Bellman-Ford algorithm 항목은 가중치가 음수여도 되고, 거리를 초기화한 뒤 모든 간선을 V-1번 완화하고 마지막에 음수 사이클을 확인해 있으면 false를 돌려주며 시간이 O(VE)라고 한다.
(실험 확인) 간선 음수가 없는 무작위 그래프(V=200·E=800, V=400·E=1600)에서 두 알고리즘의 거리 결과가 같았다. 벨만-포드는 변화가 없으면 일찍 멈추게 구현해 간선 완화 5,600회/11,200회였고 V·E 상한은 159,200/638,400이었다. A↔B 사이에 합이 -2인 사이클이 있는 그래프에서 음수 사이클이 검출됐다.
(원저자 자료) Algorithms(Erickson) 8.6절은 너비 우선 탐색의 FIFO 큐를 정점의 잠정 거리를 키로 하는 우선순위 큐로 바꾼 것이 다익스트라 알고리즘이며, 루프마다 ExtractMin으로 잠정 거리가 가장 작은 정점을 꺼내 나가는 간선을 완화한다고 설명한다. 간선 가중치가 모두 음이 아니면 꺼내는 거리가 줄어들지 않고 각 정점이 많아야 한 번 꺼내지고 꺼낸 뒤에는 거리가 바뀌지 않는다고 증명한다. 이진 힙을 쓰면 O(E log V)라고 하고, 각주에서 피보나치 힙이면 O(E + V log V), 정점을 전부 훑는 다익스트라의 원래 방식은 O(V²)이라고 쓴다.
(보충) 다익스트라를 그리디 방식이라고 부르는 것은 일반적인 설명이며, 위 책은 이 알고리즘을 최선 우선 탐색(best-first search)으로 부를 뿐 그리디라고 서술하지 않는다.
