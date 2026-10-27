---
slug: "scl-22"
topic: "spring-cloud"
tier: TRICKY
difficulty: 3
title: "`default-filters`와 라우트 필터가 같이 있으면 어떤 순서로 실행되나요?"
keywords: ["순서 없는 필터는 선언 위치가 order", "기본 필터와 라우트 필터 별도 번호", "안정 정렬로 교차 실행", "A X B Y C D", "Ordered 구현 필터는 자기 order 유지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/gatewayfilter-factories/default-filters.html", "https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/global-filters.html"]
concepts: [api-gateway, filter-chain]
importance: 1
links: [{to: "scl-09", kind: PREREQ}, {to: "scl-21", kind: PREREQ}]
---
**모범 답변 (30~60초)**
기본 필터를 전부 먼저 실행하고 그다음 라우트 필터가 실행된다고 생각하기 쉽지만 그렇지 않습니다. `Ordered`를 구현하지 않은 필터는 선언한 목록 안의 위치(1부터)가 order가 되는데, 기본 필터 목록과 라우트 필터 목록에 각각 따로 번호를 매긴 뒤 안정 정렬로 합칩니다. 번호가 같으면 추가된 순서가 유지되고 기본 필터가 앞섭니다. 그래서 기본 필터가 A, B, C, D이고 라우트 필터가 X, Y라면 실행 순서는 A, X, B, Y, C, D입니다. `Ordered`를 구현한 필터는 자기 order 값 그대로 같은 정렬에 들어갑니다.

(공식 문서) 기본 필터 문서의 순서 절은 `Ordered`를 구현하지 않은 필터에 선언된 목록 안의 위치(1부터)로 order를 부여하고, 기본 필터와 라우트 필터는 각각 따로 번호를 매겨 안정 정렬하므로 위치가 같으면 추가된 순서(기본 필터가 먼저)를 유지한다고 쓴다. 기본 필터가 A, B, C, D이고 라우트가 X, Y면 A, X, B, Y, C, D 순으로 실행되며, `Ordered`를 구현한 필터는 자기 order로 같은 목록에 정렬된다고 한다. 전역 필터 문서는 이 order에서 가장 높은 우선순위가 pre에서 먼저, post에서 마지막이라고 한다. 설정으로 직접 실행해 순서를 확인하지는 않았다.
