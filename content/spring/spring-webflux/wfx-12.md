---
slug: "wfx-12"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "`publishOn`과 `subscribeOn`은 어떻게 다른가요?"
keywords: ["publishOn은 이후 연산자 스레드 변경", "subscribeOn은 구독 스레드 변경", "위치의 중요성", "소스 바로 뒤에 배치", "Scheduler"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/coreFeatures/schedulers.html"]
concepts: [nonblocking-model, thread-pool]
importance: 1
links: [{to: "wfx-11", kind: PREREQ}, {to: "jt-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
둘 다 Scheduler를 받아 실행 스레드를 바꾸지만 영향 범위가 다릅니다. `publishOn`은 체인 중간에서 상류의 신호를 받아 지정한 Scheduler의 워커에서 하류로 내보내므로, 그 뒤의 연산자들이 (별도 스케줄러를 쓰는 연산자를 빼면) 그 스레드에서 실행되고 다른 `publishOn`을 만날 때까지 이어집니다. 그래서 놓는 위치가 중요합니다. `subscribeOn`은 구독 과정, 즉 체인이 소스까지 거슬러 올라가며 만들어지는 과정이 실행되는 스레드를 바꾸어 체인 전체에 영향을 주고, 위치는 중요하지 않지만 보통 소스 바로 뒤에 두라고 권합니다. 여러 번 써도 실질적으로 구독을 스케줄링하는 것은 하나라서 불필요한 스레드 전환만 늘어난다고 문서가 설명합니다.

(공식 문서, Reactor Threading and Schedulers) 기본적으로 대부분의 연산자는 이전 연산자가 실행된 스레드에서 이어 실행되고, 별도 지정이 없으면 소스는 `subscribe()`가 호출된 스레드에서 실행된다. `publishOn`은 다른 연산자처럼 구독자 체인 중간에 적용되어 상류 신호를 받아 해당 Scheduler의 워커에서 하류로 재생하며, 이후 연산자의 실행 위치를 바꾸고 다른 `publishOn`이 나올 때까지 유지된다. `publishOn`은 위치가 중요하고 `subscribeOn`은 위치가 중요하지 않다고 명시한다. `subscribeOn`은 체인이 거꾸로 만들어지는 구독 과정에 적용되고, 소스 바로 뒤에 두라고 권하며, 뒤의 `publishOn`의 동작에는 영향을 주지 않는다. 여러 `subscribeOn` 중 구독과 request 신호를 스케줄링하는 것은 하나뿐이고 나머지는 불필요한 스레드 전환이라고 한다.
(공식 문서, Spring WebFlux 개요) 참고로 Reactor 스케줄러 문서는 `elastic()`이 `boundedElastic()` 도입 이후 선호되지 않는다고 하므로 아래의 elastic 언급은 개념 설명으로만 읽는다. Reactor와 RxJava는 `publishOn`과 함께 쓰는 스케줄러라는 스레드 풀 추상화를 제공하고, parallel(CPU 바운드)이나 elastic(I/O 바운드) 같은 이름으로 전략을 암시한다고 설명한다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
