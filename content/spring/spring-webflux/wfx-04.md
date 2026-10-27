---
slug: "wfx-04"
topic: "spring-webflux"
tier: BASIC
difficulty: 1
title: "Reactor의 Mono와 Flux는 어떻게 다르고 언제 각각 쓰나요?"
keywords: ["Mono 0~1개", "Flux 0~N개", "Mono<Void>", "onNext·onComplete·onError", "카디널리티 표현"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/coreFeatures/flux.html", "https://projectreactor.io/docs/core/release/reference/coreFeatures/mono.html", "https://docs.spring.io/spring-framework/reference/web/webflux-reactive-libraries.html", "https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html"]
concepts: [reactive-programming]
importance: 3
links: [{to: "wfx-10", kind: FOLLOWUP}, {to: "wfx-08", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Mono는 0개 또는 1개, Flux는 0개에서 N개의 결과를 비동기로 내보내는 Reactor의 두 Publisher 타입입니다. 단건 조회나 HTTP 호출 한 번처럼 값이 하나면 `Mono<User>`, 목록이나 스트림이면 `Flux<User>`를 씁니다. 둘 다 값 없이 끝날 수 있고 종료는 `onComplete` 또는 `onError`입니다. 값 없이 완료만 알리는 비동기 작업은 `Mono<Void>`로 표현합니다. 이 구분이 중요한 이유는 기대하는 값이 하나인지 여럿인지를 타입으로 드러내기 때문이고, Spring 문서도 HTTP 메시지 인코딩, 디코딩 같은 결정에서 이 카디널리티가 중요할 수 있다고 설명합니다.

(공식 문서, Reactor 레퍼런스 Flux) `Flux<T>`는 0~N개 항목을 내보내고 완료나 오류 신호로 끝날 수 있는 표준 `Publisher`이며 범용 리액티브 타입이다. `onNext` 없이 `onComplete`만 있으면 빈 유한 시퀀스이고, `Flux.interval`은 무한 시퀀스를 만든다.
(공식 문서, Reactor 레퍼런스 Mono) `Mono<T>`는 최대 한 개의 항목을 `onNext`로 내고 `onComplete`로 끝나거나(값이 있거나 없거나) `onError`만 내는 특화된 `Publisher`이다. `onNext`와 `onError`의 조합은 명시적으로 금지된다. Mono는 Flux 연산자의 일부만 제공하고, 다른 Publisher와 합치는 일부 연산자는 Flux로 바뀐다(`Mono#concatWith`는 Flux, `Mono#then(Mono)`는 Mono). 값 없이 완료 개념만 있는 비동기 처리는 빈 `Mono<Void>`로 나타낸다.
(공식 문서, Spring Reactive Libraries) WebFlux API는 Flux나 Mono를 반환하며, 한 개인지 여러 개인지라는 카디널리티를 표현하는 것이 중요하고 이는 HTTP 메시지 인코딩, 디코딩 같은 결정에 필수적일 수 있다고 한다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
