---
slug: "misc-12"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "컨테이너가 Filter와 Interceptor, `DispatcherServlet`을 어떻게 나누는지 설명해 주세요."
keywords: ["Filter(서블릿) -> DispatcherServlet -> HandlerInterceptor -> Controller"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
요청은 톰캣이 받아서 URI에 맞는 필터들과 서블릿으로 구성된 필터 체인을 실행합니다. 필터는 서블릿 스펙의 일부라서 스프링 컨텍스트 밖의 개념이고, Spring Security도 그 자리에 끼어듭니다. 체인 끝의 서블릿이 `DispatcherServlet`이고, 여기서부터가 스프링 MVC입니다. 핸들러 매핑으로 컨트롤러를 찾고 그 앞뒤에 HandlerInterceptor가 동작합니다. 그래서 인증 같은 서블릿 레벨 처리는 필터에서, 컨트롤러 단위의 공통 처리는 인터셉터나 AOP에서 하는 식으로 위치가 달라집니다.

(공식) Filter, `DispatcherServlet`의 관계는 Spring Security 아키텍처 문서에서 확인했다. Interceptor 부분은 (보충) 일반 지식이다.
