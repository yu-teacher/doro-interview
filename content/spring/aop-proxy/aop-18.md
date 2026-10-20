---
slug: "aop-18"
topic: "aop-proxy"
tier: TRICKY
difficulty: 3
title: "private 메서드나 같은 클래스 내부 호출에도 Aspect를 적용하고 싶으면?"
keywords: ["빈 분리", "AspectJ CTW/LTW", "빌드/에이전트 비용"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/aop/proxying.html", "https://docs.spring.io/spring-framework/reference/core/aop/using-aspectj.html", "https://docs.spring.io/spring-framework/reference/core/aop/choosing.html"]
concepts: [proxy, aop]
importance: 1
links: [{to: "tx-25", kind: RELATED}]
---
**모범 답변 (30~60초)**
Spring AOP는 프록시 기반이라 private 메서드와 자기 호출에는 구조적으로 적용되지 않으므로 먼저 설계를 바꿉니다. 호출 대상을 별도 빈으로 분리해 프록시를 거치게 하는 것이 문서가 말하는 가장 덜 침습적인 방법입니다. 그래도 필요하면 AspectJ를 컴파일 타임이나 로드 타임 위빙으로 쓰면 됩니다. 이 경우 어드바이스가 프록시가 아니라 바이트코드 안에 적용되므로 자기 호출 문제가 없고 비 public 메서드도 다룰 수 있습니다. 대신 빌드에 AspectJ 컴파일러나 위버를 넣거나, 로드 타임 위빙이면 JVM 에이전트 같은 설정이 필요합니다.

(공식 문서, Proxying Mechanisms) private 메서드는 오버라이드할 수 없어 어드바이스할 수 없고, 자기 호출은 어드바이스를 우회하며 가장 덜 침습적인 대응은 자기 호출이 생기지 않게 리팩터링하는 것이다. AspectJ 컴파일 타임·로드 타임 위빙은 프록시가 아니라 바이트코드에 어드바이스를 적용하므로 이 문제가 없다.
(공식 문서, Choosing / Using AspectJ) AspectJ를 쓰면 AspectJ 컴파일러/위버를 개발·빌드 프로세스에 넣어야 한다. 비 public 메서드에 직접 `@Transactional`을 붙이는 것이 그 메서드의 트랜잭션 경계를 얻는 유일한 방법이라는 서술이 AspectJ 트랜잭션 aspect 설명에 있다. 로드 타임 위빙은 `META-INF/aop.xml`(AspectJ 표준 관례)로 위빙할 aspect를 알리고, `@EnableLoadTimeWeaving`(또는 `<context:load-time-weaver/>`)을 쓰며, Spring이 제공하는 `spring-instrument.jar`를 `-javaagent`로 지정하는 예가 있다.
