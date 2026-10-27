---
slug: "wfx-02"
topic: "spring-webflux"
tier: BASIC
difficulty: 1
title: "Reactive Streams의 Publisher, Subscriber, Subscription, Processor는 각각 어떤 역할인가요?"
keywords: ["Publisher", "Subscriber 네 가지 신호", "Subscription request·cancel", "Processor", "java.util.concurrent.Flow"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://github.com/reactive-streams/reactive-streams-jvm/blob/master/README.md", "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Flow.html", "https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html", "https://projectreactor.io/docs/core/release/reference/reactiveProgramming.html"]
concepts: [reactive-programming]
importance: 2
links: [{to: "wfx-01", kind: PREREQ}, {to: "wfx-03", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Publisher는 요소를 발행하는 생산자로 `subscribe(Subscriber)` 메서드 하나만 가집니다. Subscriber는 소비자로 `onSubscribe`, `onNext`, `onError`, `onComplete` 네 신호를 받습니다. Subscription은 둘 사이의 일대일 연결로 `request(n)`으로 받을 양을 정하고 `cancel()`로 구독을 끝냅니다. Processor는 Subscriber이면서 Publisher인 중간 처리 단계입니다. 신호 순서는 `onSubscribe`가 먼저, 이어서 `onNext`가 0번 이상이고, 끝날 때는 `onError`나 `onComplete` 중 하나입니다. 이 인터페이스들은 자바 9부터 `java.util.concurrent.Flow`에도 들어갔습니다.

(원저자 자료, Reactive Streams 사양 README) API 컴포넌트를 Publisher, Subscriber, Subscription, Processor 네 가지로 정의한다. `Subscriber`의 호출 순서는 `onSubscribe onNext* (onError | onComplete)?` 이고, `Subscription`은 정확히 하나의 Publisher와 하나의 Subscriber가 공유한다. 그래서 `subscribe()`는 `void`를 반환하고 `Subscription`은 `onSubscribe`로만 전달된다고 설명한다. `Processor`는 Subscriber이면서 Publisher이며 양쪽 계약을 모두 지켜야 한다(Processor 규칙 1).
(공식 문서, Java SE 25 Flow) `Flow`의 인터페이스는 reactive-streams 사양에 대응한다고 밝히고 `Flow.Processor`도 제공한다. Spring 문서와 Reactor 문서도 Reactive Streams 인터페이스가 Java 9에 들어갔다고 쓴다(Reactor는 `Flow` 클래스 아래라고 명시).
(실험 확인) JDK 25(Corretto 25.0.3)에서 `Flow.Publisher`를 직접 구현해 보았다. `request`를 한 번도 호출하지 않으면 `onSubscribe`만 호출되고 `onNext`는 0번이었다. 사양은 Publisher가 구독자를 여럿 받을지, 유니캐스트인지 멀티캐스트인지를 구현이 정한다고 하며(규칙 1.11), 내가 만든 구현은 구독할 때마다 1, 2, 3을 처음부터 보냈다. Reactor 코드는 실행하지 않았다.
