---
slug: "aop-07"
topic: "aop-proxy"
tier: BASIC
difficulty: 1
title: "Spring AOP와 AspectJ의 차이는?"
keywords: ["프록시 vs 바이트코드 위빙", "메서드 실행만", "Spring 빈만", "필드 접근 불가", "가장 단순한 것 선택"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/choosing.html", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-spring-defn.html", "https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/core/aop/using-aspectj.html", "https://docs.spring.io/spring-framework/reference/core/aop.html"]
concepts: [aop]
importance: 2
links: [{to: "aop-18", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Spring AOP는 프록시 기반이라 Spring 빈의 메서드 실행 지점만 어드바이스할 수 있고, AspectJ 컴파일러나 위버를 빌드에 넣을 필요가 없어 더 단순합니다. AspectJ는 완전한 AOP 프레임워크로 컴파일 타임이나 로드 타임에 바이트코드에 위빙하기 때문에, 필드 get/set 같은 메서드 실행 이외의 조인포인트와 Spring이 관리하지 않는 객체(보통 도메인 객체)도 다룰 수 있고, 프록시를 쓰지 않으니 자기 호출 문제도 없습니다. 공식 문서는 "동작하는 가장 단순한 것"을 쓰라고 하며, 빈의 메서드 실행만 필요하면 Spring AOP를 권합니다. 둘은 경쟁이 아니라 보완 관계입니다.

(공식 문서, Choosing which AOP Declaration Style / Capabilities and Goals / Using AspectJ) Spring AOP가 단순한 이유(AspectJ 컴파일러·위버를 빌드에 넣을 필요 없음), Spring 컨테이너가 관리하지 않는 객체(도메인 객체 등)나 필드 get/set 같은 메서드 실행 이외의 조인포인트에는 AspectJ가 필요하다는 점, 필드 인터셉션이 구현되어 있지 않다는 점, 둘이 경쟁이 아니라 보완 관계라는 점이 서술되어 있다. 자기 호출 문제가 AspectJ 컴파일 타임·로드 타임 위빙에는 없다는 것은 Proxying Mechanisms 페이지에, 도메인 객체에 Spring 설정을 적용하는 `@Configurable`은 Using AspectJ 페이지에 있다.
(공식 문서, AOP 개요 / Choosing) `@AspectJ` 스타일은 AspectJ 포인트컷 언어를 쓰지만 위빙은 여전히 Spring AOP가 한다. `@AspectJ` 스타일의 aspect는 Spring AOP와 AspectJ 양쪽에서 이해되므로 나중에 AspectJ로 옮기기 쉽다. 즉 `@Aspect` 애노테이션과 AspectJ 포인트컷 표현식을 쓴다고 AspectJ 위빙을 하는 것은 아니다.
