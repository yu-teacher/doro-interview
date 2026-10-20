---
slug: "mvc-01"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "Spring MVC에서 요청이 들어와 응답이 나가기까지의 흐름을 설명해 주세요."
keywords: ["DispatcherServlet", "HandlerMapping", "HandlerAdapter", "ArgumentResolver", "HttpMessageConverter", "ViewResolver", "HandlerExceptionResolver"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/special-bean-types.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/arguments.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/responsebody.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/method/support/HandlerMethodArgumentResolver.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/method/support/HandlerMethodReturnValueHandler.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/RequestMappingHandlerAdapter.html"]
---
**모범 답변 (30~60초)**
요청은 Servlet 컨테이너를 거쳐 `DispatcherServlet`으로 들어옵니다. DispatcherServlet은 `HandlerMapping`에게 요청을 처리할 핸들러(보통 `@RequestMapping` 컨트롤러 메서드)와 인터셉터 목록을 찾게 하고, `HandlerAdapter`가 호출 세부사항을 감춘 채 핸들러를 실행합니다. 어노테이션 컨트롤러에서는 ArgumentResolver가 `@PathVariable`, `@RequestBody` 같은 인자를 만들고 ReturnValueHandler가 반환값을 처리합니다. `@ResponseBody`면 `HttpMessageConverter`가 응답 본문에 쓰고, 모델과 뷰 이름이면 `ViewResolver`를 거쳐 뷰를 렌더링합니다. 예외는 `HandlerExceptionResolver` 빈들이 해결합니다.

- (공식 문서, Processing) 처리 순서는 WebApplicationContext와 로케일 리졸버를 요청에 바인딩하고, 멀티파트 리졸버가 있으면 멀티파트를 검사한 뒤, 핸들러를 찾아 실행 체인(전처리기, 후처리기, 컨트롤러)을 돌려 렌더링할 모델을 준비하는 순서다. 어노테이션 컨트롤러는 `HandlerAdapter` 안에서 뷰 없이 응답을 직접 렌더링할 수 있다. 모델이 반환될 때만 뷰를 렌더링하며, 처리 중 예외는 컨텍스트에 선언된 `HandlerExceptionResolver` 빈들이 해결한다.
- (공식 문서, Special Bean Types) `HandlerMapping`은 요청을 핸들러와 인터셉터 목록에 매핑하고, `HandlerAdapter`는 어노테이션 해석 같은 호출 세부사항을 DispatcherServlet으로부터 숨긴다. 주요 `HandlerMapping` 구현은 `RequestMappingHandlerMapping`과 `SimpleUrlHandlerMapping`이다. `ViewResolver`는 논리적 뷰 이름을 실제 View로 해석한다.
- (공식 문서, Javadoc) `HandlerMethodArgumentResolver`는 메서드 파라미터를 인자 값으로 해석하는 전략 인터페이스이고 `HandlerMethodReturnValueHandler`는 핸들러 메서드 반환값을 처리하는 전략 인터페이스다. `RequestMappingHandlerAdapter`가 이 구현체들(`setArgumentResolvers`, `setReturnValueHandlers`)을 들고 있다.
