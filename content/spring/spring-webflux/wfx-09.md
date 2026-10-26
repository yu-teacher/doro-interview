---
slug: "wfx-09"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "리액티브 시퀀스의 Cold와 Hot은 무엇이 다르고, `just`와 `defer`는 어떻게 다른가요?"
keywords: ["Cold는 구독마다 새로 시작", "Hot은 구독 이후 신호만 수신", "just는 조립 시점에 캡처", "defer로 구독 시점까지 지연", "share·replay"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/advancedFeatures/reactor-hotCold.html", "https://projectreactor.io/docs/core/release/reference/reactiveProgramming.html"]
concepts: [reactive-programming]
importance: 1
links: [{to: "wfx-08", kind: PREREQ}]
---
**모범 답변 (30~60초)**
콜드 퍼블리셔는 구독할 때마다 소스부터 새로 시작하고, 구독이 없으면 데이터를 만들지 않습니다. HTTP 호출을 감싼 콜드 시퀀스는 구독마다 요청이 새로 나갑니다. 핫 퍼블리셔는 구독자 수와 관계없이 동작하고, 나중에 구독한 쪽은 구독한 이후에 발행된 신호만 받습니다. Reactor의 대부분은 콜드이고, 문서가 드문 핫 연산자의 예로 드는 것이 `just`입니다. `just`는 값을 조립 시점에 캡처해 두었다가 이후 구독자에게 재생하므로, HTTP 호출 결과를 `just`에 넣으면 호출은 한 번만 일어납니다. 구독할 때마다 호출하려면 `defer`로 지연시키고, 반대로 콜드를 핫처럼 공유하려면 `share()`나 `replay()`를 씁니다.

(공식 문서, Reactor Hot Versus Cold) 모든 Flux와 Mono가 같은 것은 아니고 핫과 콜드 두 부류가 있다고 한다. 콜드는 구독마다 데이터를 새로 만들고 구독이 없으면 데이터가 생성되지 않는다. 핫은 구독자 수에 의존하지 않아 바로 발행을 시작할 수 있고, 나중에 온 구독자는 구독 이후의 요소만 본다. Reactor에서 핫인 연산자는 소수이고 `just`가 그 예로, 조립 시점에 값을 캡처해 이후 구독자에게 재생한다. `just`를 콜드로 바꾸려면 `defer`를 쓴다고 한다. `share()`와 `replay(...)`는 콜드를 (첫 구독 이후부터) 핫으로 바꾸는 데 쓰며, `Sinks.Many`로도 핫 소스를 만들 수 있다.
(공식 문서, 같은 페이지의 예제) 콜드 `Flux`를 두 구독자가 구독하면 둘 다 네 가지 색을 모두 받고, `Sinks`로 만든 핫 소스에서는 늦게 구독한 구독자가 일부 요소를 놓친다. (공식 문서, Reactor 레퍼런스 소개) 핫 시퀀스는 구독자가 없을 때도 발행할 수 있어 구독 전에는 아무 일도 일어나지 않는다는 규칙의 예외라고 한다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
