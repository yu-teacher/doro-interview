---
slug: "wfx-08"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "리액티브에서 \"구독하기 전에는 아무 일도 일어나지 않는다\"는 말은 무슨 뜻인가요?"
keywords: ["조립과 구독 분리", "연산자는 새 인스턴스를 반환", "subscribe가 request를 위로 전파", "구독 안 하면 실행 안 됨"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://projectreactor.io/docs/core/release/reference/reactiveProgramming.html", "https://projectreactor.io/docs/core/release/reference/faq.html", "https://docs.spring.io/spring-framework/reference/web/webflux-webclient/client-synchronous.html"]
concepts: [reactive-programming]
importance: 2
links: [{to: "wfx-04", kind: PREREQ}, {to: "wfx-09", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Reactor에서 체인을 만드는 것은 처리 과정의 설계도를 만드는 일이고, 구독하기 전에는 데이터가 흐르지 않는다는 뜻입니다. 각 연산자는 앞 단계 Publisher를 감싼 새 인스턴스를 돌려주며, `subscribe()`를 하면 구독자가 연결되면서 `request` 신호가 소스까지 거슬러 올라가고 비로소 데이터가 흐릅니다. 그래서 `flux.map(...)`만 호출하고 반환값을 받지 않으면 그 연산은 적용되지 않고, 만들어 둔 `Mono`를 아무도 구독하지 않으면 안에 든 로직도 실행되지 않습니다. 컨트롤러에서는 `subscribe()`를 직접 부르지 않고 `Mono`나 `Flux`를 반환하는 방식이 문서가 보여 주는 방식입니다.

(공식 문서, Reactor 레퍼런스) 체인을 쓴다고 데이터가 기본적으로 흐르기 시작하지 않고, 비동기 과정의 추상적 기술을 만든다. 구독이 Publisher와 Subscriber를 묶으면서 체인 전체에 데이터 흐름을 일으키고, 이는 Subscriber의 단일 `request` 신호가 소스 Publisher까지 상류로 전파되어 이루어진다고 설명한다. 각 연산자는 Publisher에 동작을 더하며 이전 단계를 새 인스턴스로 감싼다.
(공식 문서, Reactor FAQ) 연산자는 데코레이터라 다른 인스턴스를 반환한다. `flux.map(...)`의 결과를 `flux` 변수에 대입하지 않으면 구독한 것은 연산자가 적용되지 않은 원래 `flux`라서, 예시에서 출력이 원본 값으로 나온다고 설명한다. 그래서 호출을 체이닝하는 방식을 권한다.
(공식 문서, Spring WebClient 동기 사용) `Flux`나 `Mono`를 쓴다면 Spring MVC나 WebFlux 컨트롤러에서 블로킹할 필요가 없어야 하고, 결과 리액티브 타입을 컨트롤러 메서드에서 반환하라고 한다. 컨트롤러가 반환한 값을 프레임워크가 어떤 시점에 구독하는지는 이 문서들에서 확인하지 않았다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
