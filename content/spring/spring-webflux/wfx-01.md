---
slug: "wfx-01"
topic: "spring-webflux"
tier: BASIC
difficulty: 1
title: "리액티브 프로그래밍이 무엇이고, WebFlux는 왜 만들어졌나요?"
keywords: ["논블로킹", "적은 스레드로 확장", "변화에 반응", "함수형 API", "백프레셔"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://docs.spring.io/spring-framework/reference/web/webflux.html", "https://projectreactor.io/docs/core/release/reference/reactiveProgramming.html"]
concepts: [reactive-programming, nonblocking-model]
importance: 3
links: [{to: "wfx-03", kind: FOLLOWUP}, {to: "wfx-04", kind: FOLLOWUP}, {to: "mvc-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
리액티브 프로그래밍은 I/O 결과가 준비되는 것 같은 변화에 반응해서 처리를 이어 가는 논블로킹 모델입니다. 블로킹 코드는 DB나 네트워크를 기다리는 동안 스레드가 놀기 때문에 동시 요청이 늘면 스레드를 계속 늘려야 합니다. 논블로킹으로 쓰면 적은 수의 스레드가 결과가 올 때마다 일을 이어 가서 더 적은 자원으로 확장할 수 있습니다. Spring 문서는 WebFlux가 이런 논블로킹 웹 스택의 필요와, 람다 덕분에 가능해진 함수형 API 때문에 5.0에 추가되었다고 설명합니다. 여기에 빠른 생산자가 목적지를 압도하지 않게 속도를 조절하는 논블로킹 백프레셔도 리액티브의 핵심 요소로 꼽습니다.

(공식 문서, WebFlux 개요) 만들어진 이유를 두 가지로 설명한다. 하나는 소수의 스레드로 동시성을 처리하고 더 적은 하드웨어 자원으로 확장하는 논블로킹 웹 스택의 필요이다. 서블릿의 논블로킹 I/O는 `Filter`, `Servlet` 같은 동기 계약이나 `getParameter`, `getPart` 같은 블로킹 계약과 어긋나서, 논블로킹 런타임 전반의 기반이 될 새 공통 API가 필요했다고 한다. 다른 하나는 Java 8 람다가 열어 준 함수형 API이다. 문서는 reactive를 변화에 반응하는 프로그래밍 모델로 정의하고, 논블로킹 백프레셔를 Spring 팀이 reactive와 연결 짓는 또 하나의 메커니즘으로 설명한다. WebFlux 장 첫머리는 WebFlux가 5.0에서 추가되었고 완전한 논블로킹이며 Reactive Streams 백프레셔를 지원한다고 쓴다.
(공식 문서, Reactor 레퍼런스) 블로킹 코드에서는 지연(DB 요청, 네트워크 호출)이 생기면 스레드가 대기하며 자원이 낭비되고, 스레드를 늘리는 병렬화는 경합과 동시성 문제를 부르며 만능이 아니라고 설명한다. 해법의 하나로 비동기·논블로킹 코드를 들어, 같은 자원이 다른 작업으로 전환되었다가 돌아오게 한다고 한다(Reactor 3.8.8 문서를 읽었다).
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
