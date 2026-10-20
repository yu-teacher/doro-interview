---
slug: "aop-02"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "AOP 용어(Aspect, Join Point, Advice, Pointcut, Advisor, Weaving)를 설명해 주세요."
keywords: ["Aspect", "Join Point(=메서드 실행)", "Advice", "Pointcut", "Weaving(런타임)", "Target", "AOP Proxy", "Advisor"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/introduction-defn.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/Advisor.html", "https://docs.spring.io/spring-framework/reference/core/aop-api/advisor.html"]
---
**모범 답변 (30~60초)**
Aspect는 여러 클래스에 걸친 횡단 관심사를 모듈화한 것으로, Spring에서는 `@Aspect`가 붙은 일반 클래스입니다. Join Point는 실행 중의 한 지점인데 Spring AOP에서는 항상 메서드 실행을 뜻합니다. Advice는 그 지점에서 Aspect가 수행하는 동작이고, Pointcut은 Advice를 적용할 Join Point를 고르는 조건식으로 Spring은 기본적으로 AspectJ 표현식을 씁니다. Target은 어드바이스되는 대상 객체이고, AOP Proxy는 Aspect 계약을 구현하려고 AOP 프레임워크가 만든 객체입니다. Weaving은 Aspect를 대상과 연결해 어드바이스된 객체를 만드는 일이며 Spring AOP는 런타임에 합니다. Advisor는 Spring AOP API에서 Advice 하나와 Pointcut을 묶은 작은 Aspect입니다.

(공식 문서, AOP Concepts) Aspect, Join point, Advice, Pointcut, Introduction, Target object, AOP proxy, Weaving의 정의가 있다. Join point는 Spring AOP에서 항상 메서드 실행이고, AOP proxy는 JDK 동적 프록시 또는 CGLIB 프록시이며, 위빙은 컴파일 타임·로드 타임·런타임에 할 수 있는데 Spring AOP는 런타임에 한다. 많은 AOP 프레임워크(Spring 포함)는 advice를 인터셉터로 모델링하고 join point 주위에 인터셉터 체인을 유지한다.
(공식 문서, Advisor API) Spring의 Advisor는 포인트컷 표현식과 연결된 advice 객체 하나만 가진 aspect이고, `DefaultPointcutAdvisor`가 가장 흔히 쓰이는 구현이다. 같은 페이지는 하나의 AOP 프록시에 advisor와 advice 종류를 섞을 수 있다고 한다. Javadoc은 `Advisor`가 advice와 적용 여부를 거르는 필터(예: 포인트컷)를 담는 기반 인터페이스이며 일반 사용자용이 아니라 Spring 내부에서 여러 advice 종류를 공통 처리하기 위한 것이라고 설명한다.
