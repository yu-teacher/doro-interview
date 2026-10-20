---
slug: "misc-02"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "스프링이 정말 잘하는 것은 무엇이고, 서블릿 컨테이너(톰캣)는 무엇을 하나요?"
keywords: ["IoC/DI", "AOP", "서비스 추상화(PSA)", "서블릿 컨테이너", "스레드 풀", "DispatcherServlet", "내장 톰캣"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
스프링의 핵심 가치는 세 가지로 봅니다. 첫째 IoC/DI로 객체 생성과 연결을 컨테이너가 맡아서 결합도를 낮추는 것, 둘째 AOP로 트랜잭션, 보안, 로깅 같은 횡단 관심사를 비즈니스 코드 밖으로 빼는 것, 셋째 JDBC, JPA, 메시징, HTTP 클라이언트 같은 기술을 일관된 추상화로 감싸서 구현체를 바꿔도 코드가 덜 바뀌게 하는 것입니다. 반면 소켓을 열고 HTTP 요청을 파싱하고 스레드 풀로 요청을 처리하는 일은 톰캣 같은 서블릿 컨테이너의 몫입니다. 스프링 MVC는 그 위에서 `DispatcherServlet` 하나로 요청을 받아 컨트롤러로 라우팅해 줄 뿐입니다. Boot는 이 톰캣을 내장해서 실행해 줄 뿐이고요.

(공식) Spring Security 문서는 컨테이너가 요청마다 Filter들과 하나의 Servlet(Spring MVC에서는 `DispatcherServlet`)으로 구성된 `FilterChain`을 만든다고 설명한다. 즉 요청 수신과 필터/서블릿 호출 주체는 컨테이너다.
