---
slug: "aop-11"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "프록시 방식의 한계(final, private 등, Spring 빈만)는?"
keywords: ["final 클래스/메서드", "private", "가시성", "빈만 대상", "메서드 실행만"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-spring-defn.html", "https://docs.spring.io/spring-framework/reference/core/aop/choosing.html", "https://docs.spring.io/spring-framework/reference/core/aop/using-aspectj.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html"]
concepts: [proxy]
importance: 2
links: [{to: "aop-18", kind: FOLLOWUP}, {to: "tx-16", kind: RELATED}]
---
**모범 답변 (30~60초)**
CGLIB은 상속으로 프록시를 만들기 때문에 final 클래스는 프록시할 수 없고, final 메서드와 private 메서드는 오버라이드할 수 없어서 어드바이스가 적용되지 않습니다. 다른 패키지 부모 클래스의 package-private 메서드처럼 보이지 않는 메서드도 사실상 private이라 마찬가지입니다. 그리고 Spring AOP는 Spring이 관리하는 빈의 메서드 실행만 대상으로 하므로 `new`로 만든 객체나 도메인 객체에는 적용되지 않고, 필드 접근 같은 다른 조인포인트도 어드바이스할 수 없습니다. 이런 요구는 AspectJ 위빙으로 풀어야 합니다.

(공식 문서, Proxying Mechanisms) final 클래스는 확장할 수 없어 프록시할 수 없고, final 메서드와 private 메서드는 오버라이드할 수 없어 어드바이스할 수 없으며, 부모 클래스가 다른 패키지에 있는 package-private 메서드처럼 보이지 않는 메서드도 사실상 private이라 어드바이스할 수 없다.
(공식 문서, Capabilities and Goals / Choosing) Spring AOP는 Spring 빈에 대한 메서드 실행 조인포인트만 지원하고 필드 인터셉션은 구현되어 있지 않다. Spring 컨테이너가 관리하지 않는 객체(도메인 객체 등)나 필드 get/set 조인포인트가 필요하면 AspectJ를 써야 한다.
(공식 문서, Using AspectJ / @Transactional) AspectJ 모드에서는 비 public 메서드에 직접 `@Transactional`을 붙이는 것이 해당 메서드의 트랜잭션 경계를 얻는 유일한 방법이다. 참고로 프록시 모드의 `@Transactional`은 6.0부터 클래스 기반 프록시에서 protected, package-visible 메서드도 기본으로 지원하고, 인터페이스 기반 프록시에서는 인터페이스에 선언된 public 메서드여야 한다.
(실험 확인) CGLIB 프록시(`ProxyFactory`, `setProxyTargetClass(true)`)에서 final 클래스는 프록시 생성이 `AopConfigException`으로 실패한다. final 메서드는 가로채지 못하며 프록시 인스턴스 자신에서 실행되어 대상의 필드 값이 아니라 초기화되지 않은 필드(null)를 읽는다. private 메서드는 가로채지 못하지만 public 메서드가 내부에서 호출하면 정상 실행된다.
