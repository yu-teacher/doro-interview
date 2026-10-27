---
slug: "misc-11"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "`@Transactional`이 동작하지 않을 때 원인을 어떻게 찾나요?"
keywords: ["프록시", "self-invocation", "접근 제어자", "예외 삼킴", "롤백 규칙", "트랜잭션 로그", "`isActualTransactionActive`"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html", "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/TransactionSynchronizationManager.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/first-example.html"]
concepts: [declarative-tx, proxy]
importance: 3
links: [{to: "tx-15", kind: RELATED}, {to: "tx-16", kind: RELATED}, {to: "aop-10", kind: RELATED}, {to: "tx-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@Transactional`은 프록시 기반 AOP라서 프록시를 거치지 않는 호출에는 적용되지 않습니다. 그래서 순서대로 점검합니다. 첫째, 같은 클래스 안에서 `this.method()`로 부르는 self-invocation인지. 둘째, 빈이 아니라 `new`로 만든 객체인지. 셋째, private 메서드나 final 메서드·클래스라 프록시가 가로채지 못하는지, 인터페이스 기반 프록시에서 public이 아닌 메서드인지. 넷째, 예외를 catch로 삼켰거나 checked 예외라서 롤백 규칙이 발동하지 않았는지. 다섯째, `readOnly=true`나 `REQUIRES_NEW` 같은 속성이 의도와 다른지. 마지막으로 트랜잭션 로그를 켜고 `TransactionSynchronizationManager.isActualTransactionActive()`로 실제 활성 여부를 찍어 봅니다.

```yaml
logging:
  level:
    org.springframework.transaction.interceptor: TRACE
    org.springframework.orm.jpa: DEBUG
```

(공식 문서) 트랜잭션 어노테이션 문서는 프록시 모드(기본)에서는 프록시를 거쳐 들어오는 외부 호출만 가로채지므로, 같은 대상 객체 안의 다른 메서드를 부르는 self-invocation은 호출된 메서드에 `@Transactional`이 붙어 있어도 실제 트랜잭션을 만들지 않는다고 한다. 프록시가 완전히 초기화된 뒤에야 동작하므로 `@PostConstruct` 같은 초기화 코드에서 기대하면 안 되고, 이런 자기 호출까지 감싸려면 AspectJ 모드를 고려하라고 한다. 메서드 가시성은, 6.0부터 클래스 기반 프록시에서는 protected나 package-visible 메서드도 기본으로 트랜잭션 대상이 될 수 있고, 인터페이스 기반 프록시에서는 반드시 public이며 프록시되는 인터페이스에 정의된 메서드여야 한다. AOP 프록시 문서는 final 클래스는 확장할 수 없어 프록시할 수 없고, final 메서드와 private 메서드는 오버라이드할 수 없어 어드바이스할 수 없다고 한다. 롤백 규칙 문서는 기본 설정에서 `RuntimeException`과 `Error`만 롤백 표시를 하고 checked 예외는 롤백하지 않으며, 인프라가 처리되지 않고 올라오는 예외를 잡아 롤백 여부를 정하므로 예외를 직접 삼키면 롤백 트리거가 사라진다. 속성 문서는 가장 구체적인 위치(메서드)의 설정이 클래스 수준 설정보다 우선한다고 하고, Javadoc은 `readOnly`가 "실제 트랜잭션 서브시스템에 주는 힌트"일 뿐 쓰기 시도를 반드시 실패시키지는 않으며 힌트를 해석하지 못하는 트랜잭션 매니저는 조용히 무시한다고 한다. `isActualTransactionActive()`는 현재 스레드가 단순한 트랜잭션 동기화가 아니라 실제 트랜잭션에 연결되어 있는지 돌려준다고 Javadoc에 적혀 있다.

(공식 문서) 첫 예제 페이지는 트랜잭션 로그 예시로 `TransactionInterceptor`의 "Getting transaction for ..."와 `DataSourceTransactionManager`의 "Creating new transaction with name [...]" 로그를 보여 준다. (보충) 위 YAML의 로거 이름과 레벨은 일반 지식이며 문서에서 직접 확인하지 못했다. 또 클래스 수준 `readOnly=true`인 서비스에서 쓰기 메서드의 `@Transactional` 덮어쓰기를 빼면 JPA 구현에서 변경이 flush되지 않을 수 있다는 설명은, 위 `readOnly` 힌트 설명을 JPA 상황에 적용한 일반적인 정리다. 결과는 사용하는 트랜잭션 매니저와 JPA 구현에 달려 있다.

(실험 확인) Boot 4.1.1 환경에서 `isActualTransactionActive()`로 점검 항목을 확인했다. 빈(CGLIB 프록시)을 통해 public `@Transactional` 메서드를 호출하면 true였고, 같은 클래스 안에서 `this.publicTx()`로 부르는 self-invocation은 false, `new`로 만든 객체의 호출은 false, private `@Transactional` 메서드는 false, `final` 메서드는 false(같은 객체의 non-final 메서드는 true)였다. final 클래스에 CGLIB 프록시를 만들려 하자 `AopConfigException`("Could not generate CGLIB subclass ... final class")이 났다.

```java
static class Probe {
    @Transactional
    public boolean publicTx() { return TransactionSynchronizationManager.isActualTransactionActive(); }

    public boolean outer() { return this.publicTx(); }   // self-invocation: 프록시를 거치지 않는다
}
// probe.publicTx() -> true,  probe.outer() -> false,  new Probe().publicTx() -> false
```
