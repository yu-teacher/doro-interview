---
slug: "mvc-11"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "컨트롤러에서 던진 예외는 DispatcherServlet 내부에서 어떤 경로로 처리되나요? (`HandlerExceptionResolver`)"
keywords: ["HandlerExceptionResolver 체인", "ExceptionHandlerExceptionResolver", "ResponseStatusExceptionResolver", "DefaultHandlerExceptionResolver", "컨테이너 에러 페이지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/exceptionhandlers.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html"]
concepts: [global-exception-handling, mvc-request-flow]
importance: 2
links: [{to: "mvc-21", kind: FOLLOWUP}, {to: "mvc-22", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
컨트롤러 예외는 DispatcherServlet이 `HandlerExceptionResolver` 빈 체인에 위임해 해결합니다. 리졸버는 오류 뷰 `ModelAndView`, 처리 완료를 뜻하는 빈 `ModelAndView`, 다음 리졸버에게 넘기는 `null` 중 하나를 반환합니다. MVC Config가 자동 선언하는 것은 셋입니다. `ExceptionHandlerExceptionResolver`는 `@ExceptionHandler`를, `ResponseStatusExceptionResolver`는 `@ResponseStatus` 예외를, `DefaultHandlerExceptionResolver`는 Spring MVC 예외를 상태 코드로 처리합니다. 끝까지 미해결이면 Servlet 컨테이너로 전파되어 에러 페이지나 `/error`로의 ERROR 디스패치로 이어집니다.

- (공식 문서, Exceptions) 사용 가능한 구현체는 네 가지다. `SimpleMappingExceptionResolver`는 예외 클래스 이름과 오류 뷰 이름을 매핑하고, `DefaultHandlerExceptionResolver`는 Spring MVC 예외를 HTTP 상태 코드에 매핑하며, `ResponseStatusExceptionResolver`는 `@ResponseStatus` 예외를 어노테이션 값의 상태 코드로 매핑하고, `ExceptionHandlerExceptionResolver`는 `@Controller`나 `@ControllerAdvice`의 `@ExceptionHandler` 메서드를 호출한다.
- (공식 문서) 여러 `HandlerExceptionResolver` 빈과 `order`로 체인을 구성하며 order가 높을수록 뒤에 놓인다. 계약상 반환값은 오류 뷰를 가리키는 `ModelAndView`, 리졸버 안에서 처리된 경우의 빈 `ModelAndView`, 미해결이라 다음 리졸버에 맡기는 `null`이다. 끝까지 미해결이면 Servlet 컨테이너로 전파될 수 있다. MVC Config는 기본 Spring MVC 예외, `@ResponseStatus` 예외, `@ExceptionHandler` 메서드를 위한 내장 리졸버를 자동 선언하며 이 목록은 커스터마이즈하거나 교체할 수 있다.
- (공식 문서) 미해결로 전파되거나 응답 상태가 오류(4xx, 5xx)로 설정되면 컨테이너가 기본 HTML 에러 페이지를 보여 줄 수 있다. web.xml의 error-page로 `/error` 같은 URL을 지정하면 컨테이너가 그 URL로 ERROR 디스패치를 하고 DispatcherServlet이 이를 컨트롤러에 매핑해 처리할 수 있다. `@ExceptionHandler` 지원은 DispatcherServlet의 `HandlerExceptionResolver` 메커니즘 위에 만들어져 있다.
