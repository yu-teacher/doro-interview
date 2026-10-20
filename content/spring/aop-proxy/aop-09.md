---
slug: "aop-09"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "한 Aspect 안과 여러 Aspect 사이에서 어드바이스 실행 순서는 어떻게 되나요? @Order는?"
keywords: ["Around > Before > After > AfterReturning > AfterThrowing", "@Order 낮은 값 우선", "지정 안 하면 미정의"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/ataspectj/advice.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/EnableTransactionManagement.html"]
concepts: [aop]
importance: 1
---
**모범 답변 (30~60초)**
같은 Aspect 안에서 같은 조인포인트에 걸린 어드바이스는 종류별 우선순위가 있어서 Around, Before, After, AfterReturning, AfterThrowing 순으로 우선순위가 높습니다. 우선순위가 높은 것이 들어갈 때 먼저, 나올 때 마지막에 실행됩니다. 다만 After는 AspectJ의 finally 의미라서 실제로는 AfterReturning과 AfterThrowing 뒤에 실행됩니다. 같은 종류가 한 Aspect에 둘 이상이면 순서가 정의되어 있지 않아서 하나로 합치거나 Aspect를 나누고 `@Order`를 쓰라고 합니다. Aspect 사이 순서는 `@Order`나 `Ordered`로 정하며 값이 작을수록 우선순위가 높고, 지정하지 않으면 정의되지 않습니다.

```java
@Aspect @Order(1)   // 진입 시 먼저, 종료 시 마지막
public class SecurityAspect { /* @Before ... */ }

@Aspect @Order(2)
public class LoggingAspect { /* @Before ... */ }
```

(공식 문서, Advice Ordering) 가장 높은 우선순위 advice가 "들어갈 때" 먼저, "나올 때" 마지막에 실행된다. 서로 다른 aspect의 advice는 지정하지 않으면 순서가 정의되지 않고, `Ordered`/`@Order` 값이 낮은 쪽이 우선순위가 높다. 같은 `@Aspect` 클래스 안에서는 `@Around`, `@Before`, `@After`, `@AfterReturning`, `@AfterThrowing` 순으로 우선순위가 높고, `@After`는 사실상 `@AfterReturning`/`@AfterThrowing` 뒤에 호출된다. 같은 종류가 둘이면 순서가 정의되지 않는다(javac가 컴파일한 클래스는 리플렉션으로 선언 순서를 알 수 없기 때문). 하나로 합치거나 별도 `@Aspect`로 나눠 `Ordered`/`@Order`로 정하라고 권한다.
(공식 문서, Javadoc) `@EnableTransactionManagement`의 `order`(트랜잭션 어드바이저의 실행 순서) 기본값은 `Ordered.LOWEST_PRECEDENCE`다. 값이 작을수록 우선순위가 높다는 위 규칙에 따라, 더 작은 order를 준 Aspect는 트랜잭션보다 먼저(바깥에서) 실행된다.
(실험 확인) 한 Aspect에 다섯 종류를 모두 두면 정상 종료 시 순서는 around 진입, before, 대상, afterReturning, after, around 종료다. 예외 종료 시에는 afterReturning 없이 around 진입, before, 대상, afterThrowing, after, around 종료다. 두 Aspect에 `@Order(1)`, `@Order(2)`를 주면(등록 순서를 뒤집어도) 1번 진입, 2번 진입, 대상, 2번 종료, 1번 종료 순이다.
