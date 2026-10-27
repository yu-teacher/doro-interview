---
slug: "wfx-10"
topic: "spring-webflux"
tier: BASIC
difficulty: 2
title: "`map`, `flatMap`, `concatMap`, `zip`은 각각 어떻게 다른가요?"
keywords: ["map 일대일 변환", "flatMap 비동기 병합과 인터리빙", "concatMap 순서 보존", "flatMapSequential", "zip 쌍으로 결합"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/apdx-operatorChoice.html", "https://projectreactor.io/docs/core/release/api/reactor/core/publisher/Flux.html", "https://projectreactor.io/docs/core/release/reference/faq.html"]
concepts: [reactive-programming]
importance: 2
links: [{to: "wfx-04", kind: PREREQ}, {to: "jt-14", kind: RELATED}]
---
**모범 답변 (30~60초)**
`map`은 요소를 일대일로 변환합니다. `flatMap`은 각 요소를 비동기 Publisher로 바꾼 뒤 그 결과를 하나로 합치는데, 내부 Publisher를 즉시 구독하고 결과를 도착하는 대로 병합하므로 원래 순서가 지켜지지 않고 서로 끼어듭니다. 순서가 중요하면 `concatMap`을 쓰며 내부 Publisher를 차례로 이어 붙여 순서를 지킵니다. `flatMapSequential`은 비동기 작업을 즉시 시작하면서 결과만 원래 순서로 재배열합니다. `zip`은 여러 소스에서 요소를 하나씩 모아 쌍으로 결합하며 가장 짧은 소스의 개수까지만 만들어 냅니다. 요소마다 HTTP 호출을 하는 경우가 대표적인 `flatMap` 용도입니다.

(공식 문서, Reactor API 문서 Flux) `flatMap`은 요소를 비동기로 Publisher들로 바꾼 뒤 병합을 통해 하나의 Flux로 평탄화하며 서로 끼어들 수 있다. 내부 Publisher를 즉시(eagerly) 구독하고, 원래 순서를 반드시 보존하지 않으며 도착하는 대로 평탄화한다. `concatMap`은 이를 순차적으로, 순서를 보존하며 연결(concatenation)해 평탄화한다고 설명한다.
(공식 문서, Reactor 연산자 선택 부록) 1대1 변환은 `map`, 요소마다 비동기 작업(예: URL마다 HTTP 요청)은 `flatMap`과 Publisher를 반환하는 비동기 메서드, 원래 순서를 유지하려면 `Flux#flatMapSequential`(비동기 처리는 즉시 시작하고 결과를 재정렬한다고 설명)을 권한다. `Flux#zip`은 각 쪽이 모두 방출할 때마다 결합하며 가장 작은 카디널리티까지라고 한다.
(공식 문서, Reactor FAQ) `zip`이나 `zipWith`는 각 소스에서 요소가 필요하므로, 소스가 비었거나 `Mono<Void>`이면 결합 함수가 호출되지 않는다. `flatMap`도 함수가 적용될 요소가 하나는 나와야 한다고 설명한다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
