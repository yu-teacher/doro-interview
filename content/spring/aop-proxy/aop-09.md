---
slug: "aop-09"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "한 Aspect 안과 여러 Aspect 사이에서 어드바이스 실행 순서는 어떻게 되나요? @Order는?"
keywords: ["Around > Before > After > AfterReturning > AfterThrowing", "@Order 낮은 값 우선", "지정 안 하면 미정의"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
같은 Aspect 안에서 같은 조인포인트에 걸린 어드바이스는 종류별 우선순위가 있어서 Around, Before, After, AfterReturning, AfterThrowing 순으로 우선순위가 높습니다. 우선순위가 높은 것이 들어갈 때 먼저, 나올 때 마지막에 실행됩니다. 같은 종류가 한 Aspect에 둘 이상이면 순서가 정의되어 있지 않아서 하나로 합치거나 Aspect를 나누고 `@Order`를 쓰라고 합니다. Aspect 사이 순서는 `@Order`나 `Ordered`로 정하며 값이 작을수록 우선순위가 높습니다. 순서를 지정하지 않으면 서로 다른 Aspect 간 순서는 정의되지 않습니다.

```java
@Aspect @Order(1)   // 진입 시 먼저, 종료 시 마지막
public class SecurityAspect { /* @Before ... */ }

@Aspect @Order(2)
public class LoggingAspect { /* @Before ... */ }
```

- 공식 문서(advice 페이지)의 내용이다. 같은 Aspect 안의 `@After`는 사실상 `@AfterReturning`/`@AfterThrowing` 뒤에 실행된다고 서술한다.
- (보충) 트랜잭션 어드바이스와 내 Aspect의 순서도 같은 `Ordered` 메커니즘에 영향받는다. 로깅 Aspect를 트랜잭션 바깥에 두고 싶은지 안쪽에 두고 싶은지에 따라 `@Order`를 설계해야 한다. 이 구체 기본 order 값은 이번에 확인하지 않았다.
