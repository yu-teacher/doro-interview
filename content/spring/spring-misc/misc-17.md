---
slug: "misc-17"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "Spring 7 / Boot 4로 올릴 때 면접관에게 어떤 점을 짚어 말하면 좋을까요?"
keywords: ["JDK 17 기준·25 권장", "Jakarta EE 11", "Jackson 3", "JSpecify", "Hibernate 7", "마이그레이션 체크리스트"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://github.com/spring-projects/spring-framework/wiki/Spring-Framework-7.0-Release-Notes", "https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes", "https://docs.spring.io/spring-boot/system-requirements.html"]
---
**모범 답변 (30~60초)**
Framework 7은 JDK 17 기준선을 유지하면서 JDK 25를 권장하고, Jakarta EE 11 기준(Servlet 6.1, JPA 3.2, Bean Validation 3.1)으로 올라갑니다. Jackson은 3.x를 우선 지원하고 2.x는 deprecated이며 패키지가 `tools.jackson`으로 바뀝니다. 널 안정성 표기는 JSpecify로 옮겨 갔고, JSR 305 의미의 스프링 널 어노테이션은 deprecated입니다. Hibernate ORM은 7.1/7.2를 지원합니다. 그래서 업그레이드 시 JDK, 서블릿 컨테이너(Tomcat 11), Jackson import 경로, null 어노테이션, Hibernate 버전을 점검합니다. 새 기능으로는 API 버저닝, `@Retryable`/`@ConcurrencyLimit`, `RestTestClient`가 눈에 띕니다.

(공식 문서) Framework 7.0 릴리스 노트는 JDK 17 기준선을 유지하면서 최신 LTS인 JDK 25를 권장하고 Jakarta EE 11 기준선과 Kotlin 2.2, GraalVM 25를 도입한다고 한다. 최소 요구 사항으로 Servlet 6.1(Tomcat 11.0, Jetty 12.1), JPA 3.2(Hibernate ORM 7.1/7.2), Bean Validation 3.1(Hibernate Validator 9.0/9.1), Netty 4.2, JUnit 6 등을 든다. `javax.annotation`, `javax.inject` 어노테이션 지원은 제거되어 `jakarta` 쪽으로 옮겨야 한다. Jackson은 전체 스택에서 3.x를 우선 지원하고 2.x로 폴백하며, 2.x 지원은 deprecated이고 계획은 7.1에서 자동 감지를 끄고 7.2에서 완전히 제거하는 것이다. Jackson 3.x는 `tools.jackson` 패키지를 쓰지만 `jackson-annotations`의 클래스(`@JsonView` 등)는 `com.fasterxml.jackson`에 남는다. 널 안정성은 JSR 305 의미 체계의 스프링 널 어노테이션이 JSpecify 어노테이션으로 대체되며 deprecated이고, 코드베이스가 JSpecify로 이전되어 배열·가변 인자 요소와 제네릭 타입의 널 여부도 표기한다. 새 기능으로는 Spring MVC·WebFlux의 API 버저닝, `@Retryable`과 `@ConcurrencyLimit`(`@EnableResilientMethods`로 활성화), 비반응형 테스트 클라이언트 `RestTestClient`를 소개한다. Boot 4.0 릴리스 노트는 의존성 업그레이드로 Spring Framework 7.0, Spring Security 7.0, Hibernate 7.2, Jackson 3.0, Jakarta Servlet 6.1, Jakarta Persistence 3.2, Tomcat 11.0을 적고 Jackson 2 지원은 deprecated 형태로 남는다고 하며, Boot 시스템 요구 사항 문서(4.1.1)는 Java 17 이상이 필요하다고 한다.
