---
slug: "wfx-03"
topic: "spring-webflux"
tier: BASIC
difficulty: 2
title: "백프레셔(backpressure)란 무엇이고 어떻게 동작하나요?"
keywords: ["소비자가 속도 조절", "request(n)", "요청한 만큼만 발행", "무제한 요청", "버퍼·드롭·실패"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://github.com/reactive-streams/reactive-streams-jvm/blob/master/README.md", "https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://projectreactor.io/docs/core/release/reference/reactiveProgramming.html", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/SubmissionPublisher.html"]
concepts: [reactive-programming]
importance: 3
links: [{to: "wfx-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
백프레셔는 소비자가 처리할 수 있는 만큼만 생산자가 보내게 해서, 빠른 생산자가 느린 소비자를 압도하지 못하게 하는 흐름 제어입니다. Reactive Streams에서는 Subscriber가 `request(n)`으로 최대 n개를 받겠다고 알리고, Publisher는 요청받은 수를 넘겨 `onNext`를 보낼 수 없습니다. 무제한으로 요청하면 소스가 가능한 최고 속도로 밀어 넣습니다. 생산자가 속도를 늦출 수 없는 소스라면 버퍼에 쌓을지, 버릴지, 실패시킬지를 생산자가 정해야 합니다. 사양은 그 메커니즘과 경계를 정할 뿐이고 해결책은 정하지 않습니다.

(원저자 자료, Reactive Streams 사양 README) 목표를 비동기 경계를 넘는 데이터 교환을 다루면서 받는 쪽이 임의의 양을 버퍼링하도록 강요하지 않는 것이라 설명하고, 그래서 큐를 유한하게 만들 수 있도록 백프레셔가 모델의 필수 요소라고 한다. Publisher 규칙 1: 발행한 `onNext` 총수는 항상 `Subscription`이 요청한 총수 이하여야 한다. Subscriber 규칙 1: `request(long n)`으로 수요를 알려야 `onNext`를 받는다. 요청 수가 `Long.MAX_VALUE` 이상이면 Publisher가 사실상 무제한으로 간주할 수 있다(Subscription 규칙 17).
(공식 문서, Spring WebFlux 개요) 동기 블로킹 코드에서는 블로킹 호출이 호출자를 기다리게 만드는 자연스러운 백프레셔이고, 논블로킹에서는 이벤트 속도를 제어해야 한다고 설명한다. 생산자가 느려질 수 없으면 버퍼링, 드롭, 실패 중 하나를 정해야 하며 Reactive Streams는 메커니즘과 경계만 정한다고 쓴다.
(공식 문서, Reactor 레퍼런스) 구독자는 무제한 모드로 소스가 낼 수 있는 최고 속도로 받을 수도 있고, `request`로 최대 n개를 처리할 준비가 되었다고 알릴 수도 있다. 중간 연산자가 요청 수를 바꿀 수 있고(예: 10개씩 묶는 `buffer`) 일부 연산자는 프리페치를 한다. 그 결과 푸시 모델이 푸시-풀 혼합 모델이 된다고 설명한다.
(공식 문서, Java SE 25 SubmissionPublisher) `offer` 계열 메서드는 느린 구독자 때문에 버퍼가 차면 항목을 드롭할 수 있고 드롭 핸들러를 줄 수 있다. 버퍼 용량은 2의 거듭제곱으로 올림될 수 있다고 한다.
(실험 확인) JDK 25의 `Flow`로 확인했다. 직접 구현한 Publisher를 `request(2)` 단위로 소비하자 1 2, 3 4, 5 6이 차례로 배달되었고 6개 뒤에 `cancel()`을 부르자 더 생산하지 않았다(생산 6개). `SubmissionPublisher`(요청 버퍼 용량 4)에 50ms씩 걸리는 구독자를 붙이고 `offer`로 20개를 빠르게 넣으며 드롭 핸들러를 `false`로 반환하게 하니, 수신 5개 드롭 15개가 나왔다(타이밍에 따라 숫자는 달라질 수 있다). 생산자가 버릴지 결정해야 한다는 점을 보여 준다. Reactor는 실행하지 않았다.
