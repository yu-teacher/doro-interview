---
slug: "rpc-16"
topic: "api-rpc"
tier: TRICKY
difficulty: 3
title: "GraphQL의 N+1 문제는 무엇이고 DataLoader는 이를 어떻게 줄이나요?"
keywords: ["필드별 리졸버 실행", "1+N번 데이터 소스 호출", "짧은 시간 요청을 모아 배치", "DataLoader", "선택 집합을 쿼리로 변환"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://graphql.org/learn/performance/", "https://graphql.org/learn/execution/"]
concepts: [graphql, fetch-strategy]
importance: 2
links: [{to: "rpc-06", kind: PREREQ}, {to: "jpa-15", kind: RELATED}, {to: "dbp-07", kind: RELATED}]
---
**모범 답변 (30~60초)**
GraphQL은 필드마다 리졸버가 따로 실행되기 때문에, 친구 목록을 한 번 가져온 뒤 친구 N명 각각의 우주선을 따로 조회하면 데이터 소스 호출이 1+N번이 됩니다. 이것이 N+1 문제입니다. 공식 학습 자료는 짧은 시간 동안 들어온 여러 요청을 모아 한 번의 데이터베이스나 마이크로서비스 호출로 보내는 배치 기법으로 해결한다고 하며 Facebook의 DataLoader 같은 도구를 예로 듭니다. 일부 구현은 선택 집합을 최적화된 쿼리로 바꾸는 기능을 내장하기도 합니다. 학습 자료의 요약은 배치와 캐싱으로 N+1을 완화할 수 있다고 정리합니다.

(공식 문서) Performance 페이지는 GraphQL이 필드마다 단일 목적 함수를 두게 해 서버 코드가 깔끔하지만 순진하게 구현하면 데이터베이스를 반복 호출한다고 설명한다. 영웅과 친구 목록, 각 친구의 우주선 조회 예로 N+1을 정의하고, 보통 짧은 기간의 요청을 모아 한 번에 보내는 배칭으로 풀며 Facebook의 DataLoader를 예로 들고, 선택 집합을 최적화된 쿼리로 변환하는 내장 기능을 가진 구현도 있다고 한다. Execution 페이지는 리스트 필드가 각 ID의 항목을 로드하는 방식과 필드별 리졸버 구조를 보여 준다.
(실험 확인) graphql-js와 DataLoader 라이브러리 없이 구조만 흉내 낸 Node 시뮬레이션에서, 친구 5명의 우주선을 각각 조회하면 데이터 소스 호출이 5회(친구 목록 1회 별도)였고, 같은 틱의 요청을 모아 한 번에 보내는 배치 로더를 쓰면 1회였다. 실제 DataLoader의 캐싱 등 세부 동작은 읽지도 실험하지도 않았다.
