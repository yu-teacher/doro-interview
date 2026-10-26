---
slug: "wfx-15"
topic: "spring-webflux"
tier: DEEP
difficulty: 2
title: "리액티브 환경에서 트랜잭션은 어떻게 관리하고, R2DBC와는 어떻게 연결되나요?"
keywords: ["ReactiveTransactionManager", "리액티브 반환 타입의 @Transactional", "TransactionalOperator", "R2dbcTransactionManager", "구독자 Context에 연결 바인딩"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-framework/reference/data-access/transaction/strategies.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html", "https://docs.spring.io/spring-framework/reference/data-access/r2dbc.html", "https://docs.spring.io/spring-data/relational/reference/r2dbc.html", "https://docs.spring.io/spring-data/relational/reference/r2dbc/repositories.html"]
concepts: [tx-boundary, reactive-programming]
importance: 1
links: [{to: "wfx-18", kind: FOLLOWUP}, {to: "tx-04", kind: RELATED}]
---
**모범 답변 (30~60초)**
명령형 트랜잭션 상태는 실행 스레드와 연결되는 반면, 리액티브용으로는 Spring이 `ReactiveTransactionManager`라는 별도 추상화를 둡니다. 메서드가 `Mono`나 `Publisher` 같은 리액티브 타입을 반환하면 `@Transactional`을 선언형으로 쓸 수 있고, 코드로 제어하려면 `TransactionalOperator`를 `mono.as(transactionalOperator::transactional)`처럼 연산자 방식이나 콜백 방식으로 씁니다. R2DBC용 구현인 `R2dbcTransactionManager`는 R2DBC `Connection`을 구독자 `Context`에 바인딩하고, 애플리케이션 코드는 `ConnectionFactoryUtils`로 연결을 얻어야 합니다.

(공식 문서, 트랜잭션 전략) 명령형에는 `PlatformTransactionManager`, 리액티브 타입이나 코루틴을 쓰는 애플리케이션에는 `ReactiveTransactionManager`(`getReactiveTransaction`, `commit`, `rollback`이 `Mono`를 반환)를 제공한다. 명령형에서는 `TransactionStatus`가 실행 스레드와 연결된다고 쓴다. 리액티브 트랜잭션 매니저는 주로 SPI이지만 코드에서 직접 쓸 수도 있다.
(공식 문서, 선언적 `@Transactional`) 리액티브 트랜잭션 메서드는 명령형과 달리 리액티브 반환 타입(`Mono`, `Publisher`)을 쓴다. (공식 문서, 프로그래밍 방식) 리액티브 코드에는 `TransactionalOperator`가 있고, 연산자 스타일(`mono.as(transactionalOperator::transactional)`)과 콜백 스타일(`execute`) 두 방식으로 쓴다.
(공식 문서, Spring R2DBC) R2DBC는 리액티브 패턴으로 SQL DB에 접근하는 커뮤니티 주도 사양이라고 소개한다. `R2dbcTransactionManager`는 단일 `ConnectionFactory`용 `ReactiveTransactionManager` 구현이며 R2DBC `Connection`을 구독자 `Context`에 바인딩한다. 애플리케이션 코드는 R2DBC 표준의 `ConnectionFactory.create()` 대신 `ConnectionFactoryUtils.getConnection(...)`으로 연결을 얻어야 하고 `DatabaseClient` 같은 프레임워크 클래스는 이를 암묵적으로 쓴다. 풀링은 `r2dbc-pool` 같은 서드파티 구현으로 구성한다고 한다.
(공식 문서, Spring Data R2DBC) 리포지토리 예시는 `ReactiveCrudRepository<Person, Long>`를 확장한다.
Reactor와 WebFlux는 설치할 수 없어 실행해 확인하지 않았다.
