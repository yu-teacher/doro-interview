---
slug: "tst-16"
topic: "dev-test"
tier: TRICKY
difficulty: 3
title: "테스트 메서드에 `@Transactional`을 붙이면 자동 롤백되는데, 어떤 함정이 있나요?"
keywords: ["테스트 트랜잭션 기본 롤백", "RANDOM_PORT는 별도 스레드 트랜잭션", "서버 쪽 변경은 커밋됨", "수동 flush 필요", "선점형 타임아웃"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html", "https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", "https://docs.spring.io/spring-framework/reference/testing/integration.html"]
---
**모범 답변 (30~60초)**
테스트 메서드나 클래스에 `@Transactional`을 붙이면 테스트가 트랜잭션 안에서 실행되고 끝나면 기본적으로 롤백되어, DB를 따로 정리하지 않아도 됩니다. 함정은 먼저 `RANDOM_PORT`처럼 실제 서버를 띄운 경우입니다. HTTP 요청이 서버 스레드의 별도 트랜잭션에서 처리되어서 롤백되지 않고 그대로 커밋됩니다. `assertTimeoutPreemptively`처럼 다른 스레드에서 테스트를 실행하는 선점형 타임아웃도 같은 이유로 롤백이 안 됩니다. 또 JPA나 하이버네이트에서는 flush를 하지 않으면 SQL 오류가 가려진 채 테스트가 통과하는 거짓 양성이 생길 수 있어서, 직접 flush가 필요합니다. 서비스의 트랜잭션 전파가 `REQUIRED`나 `SUPPORTS`가 아닌 경우도 조심해야 합니다.

(공식 문서) Spring Framework 테스트 장의 Transaction Management 절은 `@Transactional` 테스트가 기본으로 롤백되고, 테스트 관리 트랜잭션이 현재 스레드(`ThreadLocal`)에 묶여 있어서 JUnit Jupiter의 `assertTimeoutPreemptively`처럼 다른 스레드에서 테스트 메서드를 실행하면 그 안의 작업이 테스트 트랜잭션 밖에서 실행되어 롤백되지 않고 커밋된다고 경고한다. 애플리케이션 쪽 트랜잭션의 전파가 `REQUIRED`나 `SUPPORTS`가 아니면 주의하라고 하고, Hibernate 예제에서 `flush()`를 하지 않으면 거짓 양성이 생긴다고 설명한다. Boot 4.1.1 문서는 `RANDOM_PORT`나 `DEFINED_PORT`에서는 클라이언트와 서버가 다른 스레드와 트랜잭션이라 서버에서 시작된 트랜잭션이 롤백되지 않는다고 한다.
(실험 확인) Spring Boot 4.1.0, H2 인메모리 DB, `JdbcTemplate` 실험에서(행 이름별로 개수를 세어 다른 테스트의 영향을 뺐다) `@Transactional` 테스트가 행을 넣으면 그 안에서 개수는 1이었고 다음 테스트에서는 0이었다(롤백됨). `@Transactional`이 없는 테스트가 넣은 행은 커밋되어 다음 테스트가 개수 1을 봤다. 클래스에 `@Transactional`을 붙이고 `RANDOM_PORT`로 서버를 띄운 테스트에서 직접 `JdbcTemplate`으로 넣은 행과 `POST /users/port-http`(응답 200)로 넣은 행이 테스트 안에서는 둘 다 개수 1이었는데, 다음 테스트에서는 직접 넣은 행이 0(롤백), HTTP로 넣은 행은 1(커밋됨)이었다. 같은 `@Transactional` 테스트라도 기본 `MOCK` 모드에서 `MockMvc`로 `POST`한 행은 다음 테스트에서 0이었다(같은 스레드라서 롤백). `@Transactional` 테스트 안에서 `assertTimeoutPreemptively` 람다로 넣은 행(`junit-timeout-thread-1`에서 실행)은 다음 테스트에서 개수 1로 남았고, 람다 밖에서 넣은 행은 0이었다. 이때 람다 안에서도 `TestTransaction.isActive()`는 true로 보고되었으므로 이 값으로 같은 트랜잭션인지를 판단해서는 안 된다. `@DataJpaTest`(Hibernate, H2)에서 시퀀스 방식 ID 엔티티에 길이 제한을 넘는 값을 `save`만 하면 예외 없이 통과했고 `saveAndFlush`는 `DataIntegrityViolationException`이었다. 반면 `IDENTITY` 방식 ID 엔티티는 `save` 시점에 바로 같은 예외가 났다(ID 생성 방식에 따라 insert 시점이 달라 거짓 양성이 안 생길 수도 있다). `REQUIRES_NEW` 같은 전파 설정은 실행해 보지 않았다.
