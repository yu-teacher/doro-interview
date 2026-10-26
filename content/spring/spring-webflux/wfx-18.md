---
slug: "wfx-18"
topic: "spring-webflux"
tier: TRICKY
difficulty: 3
title: "리액티브 트랜잭션에서 `take(1)`이나 `timeout` 같은 연산자를 붙이면 롤백될 수 있다는데 무슨 뜻인가요?"
keywords: ["취소 신호", "Spring 5.3부터 롤백", "취소 이유를 알 수 없음", "하류 연산자 take·timeout", "전체 출력을 소비해야 완료"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html"]
concepts: [tx-boundary, reactive-programming]
importance: 1
links: [{to: "wfx-15", kind: PREREQ}, {to: "tx-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
리액티브에서는 구독자가 구독을 취소할 수 있고, `next()`, `take(long)`, `timeout(Duration)` 같은 연산자가 취소 신호를 보냅니다. 그런데 취소된 이유가 오류 때문인지 단지 더 볼 필요가 없어서인지는 알 방법이 없습니다. 그래서 Spring 5.3부터 취소 신호는 트랜잭션 롤백으로 이어집니다. 따라서 트랜잭션이 걸린 Publisher의 하류에 어떤 연산자를 쓰는지 신경 써야 하고, 특히 `Flux` 같은 다건 Publisher에서는 전체 출력을 끝까지 소비해야 트랜잭션이 완료됩니다. 쉽게 말해 트랜잭션 안의 `Flux`에 `take(1)`을 붙이면 의도와 달리 롤백될 수 있습니다.

(공식 문서, 프로그래밍 방식 트랜잭션 Cancel Signals) Reactive Streams에서 `Subscriber`는 `Subscription`을 취소해 `Publisher`를 멈출 수 있고, Project Reactor의 `next()`, `take(long)`, `timeout(Duration)` 등의 연산자가 취소를 발행할 수 있다. 취소 이유가 오류인지 단순한 소비 중단인지 알 방법이 없으며, 버전 5.3부터 취소 신호는 롤백을 일으킨다. 그래서 트랜잭션 Publisher 하류에서 쓰는 연산자를 고려해야 하고, 특히 `Flux` 같은 다건 Publisher에서는 트랜잭션이 완료되려면 전체 출력을 소비해야 한다고 쓴다.
(공식 문서, 선언적 `@Transactional`) 리액티브 `Publisher` 반환에는 취소 신호에 관한 특별한 고려가 있으며 `TransactionalOperator` 절의 Cancel Signals를 참고하라고 안내한다.
(보충) `take(1)` 예시는 위 문서 문장을 적용한 예이며 직접 실행해 확인하지 않았다. 또 `@Transactional`이 붙은 메서드를 호출하는 쪽에서 반환된 `Flux`에 `take`를 붙이는 경우도 같은 취급인지는 읽은 문서에서 확인하지 않았다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
