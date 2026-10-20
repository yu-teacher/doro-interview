---
slug: "mvc-16"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "Spring MVC와 WebFlux의 차이, 그리고 선택 기준은?"
keywords: ["블로킹 vs 논블로킹", "Reactive Streams", "back pressure", "JPA/JDBC", "학습 곡선"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html"]
concepts: [thread-pool, io-filesystem]
importance: 2
links: [{to: "mvc-17", kind: FOLLOWUP}, {to: "osm-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
Spring MVC는 Servlet API 위의 명령형 스택으로, 문서는 현재 스레드를 블로킹할 수 있다고 가정해 컨테이너가 큰 스레드 풀로 흡수한다고 설명합니다. WebFlux는 Reactive Streams와 논블로킹 I/O 위에서 작은 고정 스레드로 동시성을 처리하고 back pressure를 지원합니다. 잘 동작하는 MVC 앱은 바꿀 필요가 없고 JPA나 JDBC 같은 블로킹 영속성을 쓰면 MVC가 보통 최선이며, 논블로킹 스택이나 함수형 엔드포인트가 필요할 때 WebFlux를 고려하라고 합니다. 리액티브가 더 빠르게 해 주지는 않고 지연 있는 I/O에서 적은 스레드와 메모리로 확장하는 것이 이점이며, 학습 곡선도 부담입니다. WebFlux에서 Servlet 필터 매핑은 강하게 비권장됩니다.

- (공식 문서, WebFlux 개요) WebFlux가 만들어진 이유는 적은 수의 스레드로 동시성을 처리하고 적은 하드웨어 자원으로 확장하는 논블로킹 웹 스택의 필요와 함수형 프로그래밍 모델이다. Reactive Streams는 구독자가 발행자의 속도를 제어하게 하는 back pressure 메커니즘을 정의한다.
- (공식 문서) 선택 기준: 잘 동작하는 MVC 앱은 바꿀 필요가 없다. JPA, JDBC 같은 블로킹 영속성이나 네트워킹 API를 써야 하면 MVC가 적어도 일반적인 아키텍처에서는 최선이다. 논블로킹 스택을 찾고 있거나 함수형 웹 엔드포인트를 원하면 WebFlux를 고려한다. 큰 팀은 논블로킹, 함수형, 선언형으로 옮기는 데 가파른 학습 곡선이 있음을 염두에 둔다. 원격 호출이 있는 MVC 앱은 반응형 `WebClient`부터 써볼 수 있다.
- (공식 문서) 동시성 모델: MVC는 블로킹을 가정하고 큰 스레드 풀을 쓰며, WebFlux는 블로킹하지 않는다고 가정하고 작은 고정 크기 스레드 풀(이벤트 루프 워커)을 쓴다. 성능: 리액티브와 논블로킹은 일반적으로 앱을 더 빠르게 만들지 않으며 더 많은 작업이 필요해 처리 시간이 조금 늘 수 있다. 기대 이점은 작고 고정된 스레드 수와 적은 메모리로 확장하는 능력이며, 이를 보려면 어느 정도의 지연(느리고 예측 불가능한 네트워크 I/O)이 있어야 한다. Servlet 필터 매핑이나 Servlet API 직접 조작은 WebFlux 컨텍스트에서 강하게 비권장되고 블로킹/논블로킹 I/O 혼용은 런타임 문제를 일으킨다.
