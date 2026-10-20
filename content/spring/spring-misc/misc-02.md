---
slug: "misc-02"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "스프링이 정말 잘하는 것은 무엇이고, 서블릿 컨테이너(톰캣)는 무엇을 하나요?"
keywords: ["IoC/DI", "AOP", "서비스 추상화(PSA)", "서블릿 컨테이너", "스레드 풀", "DispatcherServlet", "내장 톰캣"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/overview.html", "https://docs.spring.io/spring-framework/reference/core/aop.html", "https://docs.spring.io/spring-framework/reference/data-access/dao.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html", "https://docs.spring.io/spring-security/reference/servlet/architecture.html", "https://docs.spring.io/spring-boot/reference/web/servlet.html", "https://docs.spring.io/spring-boot/index.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
concepts: [ioc-di, aop, mvc-request-flow]
importance: 2
links: [{to: "misc-12", kind: FOLLOWUP}, {to: "mvc-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
스프링의 핵심 가치는 세 가지로 봅니다. 첫째 IoC/DI로 객체 생성과 연결을 컨테이너가 맡아 결합도를 낮추는 것, 둘째 AOP로 트랜잭션 같은 횡단 관심사를 비즈니스 코드 밖으로 빼는 것, 셋째 JDBC, JPA 같은 기술을 일관된 방식으로 감싸서 구현체를 바꿔도 코드가 덜 바뀌게 하는 것입니다. 반면 HTTP 요청을 받아 워커 스레드로 처리하는 일은 톰캣 같은 서블릿 컨테이너의 몫입니다. 컨테이너가 요청 경로에 맞는 필터들과 서블릿으로 FilterChain을 만들고, Spring MVC에서는 그 서블릿이 `DispatcherServlet`이라 컨트롤러로 라우팅합니다. Boot는 이 서버를 내장해서 `java -jar`로 실행할 수 있게 해 줄 뿐입니다.

(공식 문서) 요청 처리 주체에 대해서는 다음이 확인된다. Spring Security 문서는 클라이언트 요청이 오면 컨테이너가 요청 URI 경로에 따라 Filter들과 Servlet으로 구성된 `FilterChain`을 만들고, Spring MVC 애플리케이션에서 그 Servlet은 `DispatcherServlet`의 인스턴스라고 설명한다. MVC 문서는 `DispatcherServlet`을 프론트 컨트롤러 패턴의 중앙 서블릿으로 설명하며, 서블릿 명세에 따라 선언·매핑해야 하는 서블릿이라고 한다. Boot 문서는 서블릿 애플리케이션에 내장 Tomcat과 Jetty를 지원하고 내장 서버가 기본 포트 8080에서 HTTP 요청을 받는다고 하며, Boot 프로퍼티 목록에는 `server.tomcat.threads.max`가 "워커 스레드의 최대 개수"로 나온다. 스프링의 가치 쪽은, Framework 문서가 AOP의 대표 용도로 선언적 트랜잭션 같은 엔터프라이즈 서비스를 들고, DAO 지원이 JDBC·Hibernate·JPA 같은 영속성 기술을 일관된 방식으로 다루며 기술을 쉽게 바꿀 수 있게 해 준다고 설명한다. Boot 문서는 java -jar 실행과 내장 서버 같은 기능을 Boot의 목표로 든다.

(보충) "소켓을 열고 HTTP 메시지를 파싱한다"는 서블릿 컨테이너의 내부 동작 설명은 조사한 스프링 문서에서 직접 확인하지 않은 일반 지식이다. 또 "세 가지 핵심 가치(IoC/DI, AOP, 서비스 추상화)"라는 묶음과 서비스 추상화(PSA)라는 이름은 문서의 공식 분류가 아니라 흔히 쓰는 정리다.

(실험 확인) 기본 설정으로 띄운 Boot 애플리케이션(Boot 4.1.1, Java 21)에 요청을 보내고 필터에서 현재 스레드를 기록하면, 요청은 호출한 테스트 스레드와 다른 `http-nio-auto-N-exec-M` 이름의 플랫폼 스레드에서 처리되었다. 즉 요청마다 톰캣의 워커 스레드가 쓰인다.
