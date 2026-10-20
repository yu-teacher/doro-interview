---
slug: "aop-01"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "AOP가 무엇이고 왜 쓰나요?"
keywords: ["횡단 관심사", "Aspect", "선언적 트랜잭션", "여러 객체에 걸친 적용", "비즈니스 로직 분리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html"]
---
**모범 답변 (30~60초)**
AOP는 OOP를 보완하는 프로그래밍 방식입니다. OOP의 모듈 단위가 클래스라면 AOP의 모듈 단위는 Aspect이고, 트랜잭션 관리처럼 여러 타입과 객체에 걸쳐 있는 횡단 관심사를 하나의 모듈로 묶습니다. 포인트컷으로 적용 대상을 클래스 계층과 무관하게 고를 수 있어서, 서비스 계층의 모든 비즈니스 메서드에 선언적 트랜잭션 같은 동작을 비즈니스 코드를 건드리지 않고 적용할 수 있습니다. Spring은 AOP로 선언적 엔터프라이즈 서비스를 제공하고, 그중 가장 중요한 것이 선언적 트랜잭션 관리입니다. 개발자가 직접 Aspect를 만들 수도 있습니다. 참고로 IoC 컨테이너는 AOP에 의존하지 않아서 AOP 없이도 Spring을 쓸 수 있습니다.

(공식 문서, AOP 개요) AOP는 OOP에 프로그램 구조를 바라보는 또 다른 방식을 더하는 것이며 OOP의 모듈 단위는 클래스, AOP의 모듈 단위는 Aspect다. Spring IoC 컨테이너는 AOP에 의존하지 않는다. Spring에서 AOP는 선언적 엔터프라이즈 서비스(가장 중요한 것이 선언적 트랜잭션 관리)와 사용자 정의 Aspect 구현에 쓰인다.
(공식 문서, AOP Concepts) Pointcut은 advice를 객체지향 계층과 독립적으로 적용 대상에 지정하게 해 준다. 예로 서비스 계층의 모든 비즈니스 메서드처럼 여러 객체에 걸친 메서드 집합에 선언적 트랜잭션을 제공하는 around advice를 적용할 수 있다.
