---
slug: "wfx-20"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "리액티브 코드의 스택 트레이스는 왜 읽기 어렵고, 어떻게 디버깅하나요?"
keywords: ["연산자 내부 프레임", "조립 지점 정보", "Hooks.onOperatorDebug", "checkpoint()", "ReactorDebugAgent"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/debugging.html"]
concepts: [reactive-programming]
importance: 1
links: [{to: "wfx-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
리액티브 오류는 구독 시점에 발생하는데, 스택 트레이스에는 연산자 내부 프레임과 구독 지점만 나와서 어떤 코드가 그 체인을 조립했는지 알기 어렵습니다. 문제의 `Flux`는 다른 곳에서 만들어졌을 수 있기 때문입니다. Reactor는 조립 지점 정보를 덧붙이는 방법을 세 가지 제공합니다. `Hooks.onOperatorDebug()`는 모든 연산자 조립 시점에 스택을 캡처하는 가장 쉽지만 가장 느린 방법이고, `checkpoint()`는 원하는 체인에만 같은 정보를 남깁니다. `checkpoint(String)`은 스택 대신 설명 문자열을 써서 비용이 더 적습니다. 운영 환경에는 연산자마다 스택을 캡처하는 비용 없이 비슷한 정보를 주는 `ReactorDebugAgent`가 있고, 신호의 흐름은 `log()`로 볼 수 있습니다.

(공식 문서, Reactor Debugging) 비동기 코드에서는 일반적인 Reactor 스택 트레이스가 연산자 내부 클래스(`FluxFlatMap`, `FluxRange` 등)와 구독 지점만 보여, 체인이 조립된 곳(assembly)을 알기 어렵다고 예를 들어 설명한다. `Hooks.onOperatorDebug()`는 가장 쉽지만 연산자마다 스택을 캡처하므로 가장 느린 방법이라고 하고, 통제된 방식으로 최후의 수단으로만 켜라고 권한다. `checkpoint()`는 특정 체인에만 같은 방식을 적용하고, `checkpoint(String)`은 스택 없이 설명으로 조립 지점을 식별해 비용이 더 적다. `reactor-tools`의 `ReactorDebugAgent`는 연산자 호출마다 스택을 캡처하는 비용 없이 비슷한 디버깅 정보를 주며 `ReactorDebugAgent.init()`으로 초기화한다. 바이트코드 조작에 `ByteBuddy` 자가 부착을 쓰며 일부 JVM에서는 동작하지 않을 수 있다고 한계를 밝힌다. `log()` 연산자는 체인에 끼워 넣으면 그 상류의 `onNext`, `onError`, `onComplete`뿐 아니라 구독, 취소, 요청 이벤트까지 들여다본다고 설명한다(Logging a Sequence 절).
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
