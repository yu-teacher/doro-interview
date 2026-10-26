---
slug: "wfx-13"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "리액티브 파이프라인에서 오류는 어떻게 전파되고 어떻게 처리하나요?"
keywords: ["오류는 종료 신호", "구독자 onError", "onErrorReturn·onErrorResume", "onErrorMap·doOnError", "retryWhen backoff"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/coreFeatures/error-handling.html", "https://projectreactor.io/docs/core/release/reference/faq.html"]
concepts: [reactive-programming, exception-handling]
importance: 1
links: [{to: "wfx-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
리액티브 스트림에서 오류는 종료 신호라서, 발생하면 시퀀스가 끝나고 하류를 거쳐 구독자의 `onError`로 전달됩니다. 문서는 구독자의 `onError`를 항상 정의하라고 하고, 정의하지 않으면 `UnsupportedOperationException`이 던져진다고 설명합니다. 체인 중간에서는 `onErrorReturn`으로 정적 대체값을, `onErrorResume`으로 대체 Publisher를, `onErrorMap`으로 다른 예외로의 변환을 선택하고, `doOnError`는 오류를 그대로 전파하면서 로깅 같은 부수 효과만 합니다. 이 연산자들은 원래 시퀀스를 이어 가게 하는 것이 아니라 오류 신호를 새 시퀀스의 시작으로 바꿔 끼우는 것입니다. 재시도는 `retryWhen`과 `Retry.backoff`를 씁니다.

(공식 문서, Reactor Handling Errors) Reactive Streams에서 오류는 종료 이벤트라서 시퀀스를 멈추고 하류 끝의 `Subscriber`의 `onError`까지 전파된다. 구독자의 `onError`는 항상 정의해야 하며 정의하지 않으면 `UnsupportedOperationException`을 던진다. 오류 처리 연산자를 써도 원래 시퀀스는 이어지지 않고, `onError` 신호를 폴백 새 시퀀스의 시작으로 바꾸어 상류의 종료된 시퀀스를 대체한다고 한다. 연산자 대응: 정적 폴백 `onErrorReturn`, 오류를 삼키고 완료 신호로 바꾸는 `onErrorComplete`, 폴백 메서드 `onErrorResume`(예외 종류별 분기 가능), 예외 변환 `onErrorMap`, 오류를 계속 전파하며 부수 효과를 두는 `doOnError`.
(공식 문서, Reactor FAQ) `retryWhen`으로 지수 백오프를 구현할 때 3.3.4.RELEASE부터 `Retry.backoff` 빌더가 제공된다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
