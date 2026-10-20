---
slug: "aop-13"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "@Transactional이 프록시로 동작하는 이유는? (연결만)"
keywords: ["선언적 트랜잭션", "프록시가 begin/commit/rollback", "프록시 한계 상속"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html", "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html"]
concepts: [declarative-tx, proxy]
importance: 3
links: [{to: "aop-05", kind: PREREQ}, {to: "tx-04", kind: RELATED}, {to: "tx-25", kind: RELATED}, {to: "misc-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
`@Transactional`은 AOP의 대표적인 적용 사례입니다. 선언적 트랜잭션 지원은 AOP 프록시로 동작하고, 트랜잭션 어드바이스는 애노테이션 같은 메타데이터가 구동합니다. 프록시가 `TransactionInterceptor`와 `TransactionManager`로 메서드 호출 앞뒤에서 트랜잭션을 구동해 주기 때문에 비즈니스 코드에는 트랜잭션 코드가 없습니다. 그래서 프록시 한계가 그대로 적용됩니다. 같은 클래스 안의 자기 호출은 프록시를 우회해 트랜잭션이 안 걸리고, final 메서드도 CGLIB 프록시로는 가로챌 수 없습니다. 자세한 전파/격리/롤백 규칙은 트랜잭션 문서에서 다룹니다.

(공식 문서, AOP 개요) Spring이 AOP로 제공하는 가장 중요한 서비스가 선언적 트랜잭션 관리다.
(공식 문서, 선언적 트랜잭션 구현 설명) 선언적 트랜잭션 지원은 AOP 프록시로 활성화되고 트랜잭션 어드바이스는 메타데이터(XML 또는 애노테이션)가 구동한다. AOP와 트랜잭션 메타데이터가 결합해 `TransactionInterceptor`를 적절한 `TransactionManager`와 함께 쓰는 AOP 프록시가 되어 메서드 호출 주위에서 트랜잭션을 구동한다. 프록시의 한계(자기 호출 우회, final·private 메서드 불가)는 Proxying Mechanisms 페이지가 설명한다.
(실험 확인) Boot 환경에서 `@Transactional`이 붙은 서비스 빈을 `Advised`로 캐스팅해 어드바이저 목록을 보면 `TransactionInterceptor`가 들어 있고, 프록시 뒤에는 원본 객체가 따로 있다. 트랜잭션 안에서 예외가 나면 저장한 것이 전부 롤백되고, 트랜잭션이 없으면 예외가 나도 저장한 것이 남으며, `this`로 부른 자기 호출은 같은 예외에서도 롤백되지 않는다.
