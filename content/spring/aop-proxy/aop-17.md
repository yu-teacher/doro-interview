---
slug: "aop-17"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "같은 빈에 Aspect가 적용되는지 어떻게 확인하나요?"
keywords: ["AopUtils", "isCglibProxy", "클래스명 접미사", "getTargetClass"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/aop/support/AopUtils.html"]
concepts: [proxy]
importance: 1
links: [{to: "misc-11", kind: RELATED}]
---
**모범 답변 (30~60초)**
빈의 실제 클래스를 출력해서 `$$SpringCGLIB$$` 같은 접미사가 붙었는지 보거나, `AopUtils.isAopProxy`, `isCglibProxy`, `isJdkDynamicProxy` 같은 유틸로 확인합니다. `isAopProxy`는 JDK 동적 프록시든 CGLIB 프록시든 true이고, 나머지 둘은 각각 종류를 구분합니다. 프록시 뒤의 원본 클래스가 필요하면 `AopUtils.getTargetClass`로 대상 클래스를 구합니다. 주입된 빈이 원본인지 프록시인지 이 유틸로 바로 판별할 수 있습니다.

```java
System.out.println(bean.getClass());          // 접미사 확인 (...$$SpringCGLIB$$...)
AopUtils.isAopProxy(bean);                    // JDK 또는 CGLIB 프록시인가
AopUtils.isCglibProxy(bean);                  // CGLIB 프록시인가
AopUtils.isJdkDynamicProxy(bean);             // JDK 동적 프록시인가
AopUtils.getTargetClass(bean);                // 프록시일 수 있는 빈의 대상 클래스
```

(공식 문서, `AopUtils` Javadoc) `isAopProxy`는 JDK 동적 프록시 또는 CGLIB 프록시인지, `isCglibProxy`는 CGLIB 프록시인지, `isJdkDynamicProxy`는 JDK 동적 프록시인지 검사하고, `getTargetClass`는 AOP 프록시일 수 있는 빈 인스턴스의 대상 클래스를 구한다.
(실험 확인) Spring Boot 4.1 환경에서 인터페이스 없는 `@Service`를 주입받아 확인하면 `isAopProxy`와 `isCglibProxy`가 true이고, 클래스명에 `$$SpringCGLIB$$`가 들어 있고, `getTargetClass`는 원본 클래스이며 주입된 객체는 원본 타입의 인스턴스(서브클래스)다. 접미사 이름은 공식 문서에서 확인하지 않았고 이 실험 결과로만 확인했다.
