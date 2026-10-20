---
slug: "alg-07"
topic: "cs-algorithm"
tier: BASIC
difficulty: 1
title: "BFS와 DFS는 어떻게 다르고 각각 언제 쓰나요?"
keywords: ["큐 기반 BFS", "재귀·스택 기반 DFS", "간선 수 최단 경로는 BFS", "정점과 간선 한 번씩 O(V+E)"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://xlinux.nist.gov/dads/HTML/breadthfirst.html", "https://xlinux.nist.gov/dads/HTML/depthfirst.html"]
---
**모범 답변 (30~60초)**
BFS는 시작 정점에서 가까운 정점부터 층별로 방문하는 탐색이라 보통 큐로 구현하고, DFS는 한 방향으로 끝까지 들어간 뒤 되돌아오는 탐색이라 재귀나 스택으로 구현합니다. 가중치가 없는 그래프에서 간선 수가 가장 적은 경로는 BFS가 보장하고, DFS는 찾은 경로가 최단이라는 보장이 없습니다. 반대로 경로 전체를 훑는 백트래킹이나 사이클 탐색, 위상 정렬 같은 곳에는 DFS가 자연스럽습니다. 인접 리스트를 쓰면 둘 다 정점과 간선을 한 번씩만 보므로 O(V+E)입니다.

(공식 문서) DADS breadth-first search 항목은 한 정점의 이웃을 그 정점의 다음 단계보다 먼저 고려하는 탐색이며 보통 큐로 구현하고 트리에서는 레벨 순회와 같다고 한다. depth-first search 항목은 정점의 자식을 형제보다 먼저 고려하며 재귀로 쉽게 구현할 수 있고, 정점을 간선 전/중/후 중 언제 처리하는지는 정하지 않는다고 한다.
(실험 확인) 간선 A→B, A→E, B→C, C→D, D→G, E→G 그래프에서 A에서 G까지 BFS 경로는 [A,E,G](간선 2개), 이웃을 나열한 순서대로 따라가는 DFS는 [A,B,C,D,G](간선 4개)였다. 정점 2000개·간선 8000개의 무작위 방향 그래프에서 BFS가 방문한 정점 1,956개, 훑은 간선 7,804개로 각각 V와 E를 넘지 않았다.
(보충) DFS를 명시적 스택으로 구현할 수 있다는 것, BFS가 간선 수 기준 최단 경로를 보장한다는 정리, O(V+E)라는 표기, 백트래킹·사이클 탐색·위상 정렬에 DFS가 자연스럽다는 설명은 일반 그래프 알고리즘 지식이고 위 문서는 직접 서술하지 않는다.
