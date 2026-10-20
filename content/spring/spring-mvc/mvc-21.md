---
slug: "mvc-21"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "Filter에서 던진 예외도 `@ControllerAdvice`로 잡히나요?"
keywords: ["Filter 예외", "컨테이너 에러 디스패치", "DispatcherServlet 바깥"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/exceptionhandlers.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/sequence.html"]
---
**모범 답변 (30~60초)**
기본적으로 잡히지 않습니다. `@ExceptionHandler`는 DispatcherServlet 수준의 `HandlerExceptionResolver` 메커니즘 위에 만들어졌는데, Filter는 Servlet 필터 체인에서 대상 Servlet, 즉 DispatcherServlet의 앞뒤에서 실행되기 때문입니다. 필터에서 던진 예외는 DispatcherServlet의 예외 해결 체인에 도달하지 못하고 Servlet 컨테이너로 전파되어, 컨테이너의 에러 페이지 처리나 ERROR 디스패치(`/error`)로 다뤄집니다. 필터에서 일관된 오류 응답을 주고 싶다면 필터 안에서 직접 응답을 쓰거나, ERROR 디스패치를 받는 컨트롤러를 두는 식으로 별도 처리해야 합니다.

- (공식 문서, Filters) Servlet `Filter`는 나머지 필터 체인과 대상 Servlet의 앞뒤에 인터셉션 방식 로직을 적용한다. 즉 필터는 DispatcherServlet을 감싸는 위치에 있다.
- (공식 문서, Exceptions) `@ExceptionHandler` 지원은 DispatcherServlet 수준의 `HandlerExceptionResolver` 메커니즘 위에 만들어져 있다. 어떤 `HandlerExceptionResolver`도 처리하지 못해 전파된 예외는 Servlet 컨테이너로 올라가며, 컨테이너는 설정된 URL(예: `/error`)로 ERROR 디스패치를 하고 DispatcherServlet이 이를 컨트롤러에 매핑해 JSON이나 오류 뷰를 렌더링할 수 있다. 문서 예제가 그런 `/error` 컨트롤러를 보여 준다.
- (보충) 필터에서 던진 예외가 `HandlerExceptionResolver`를 거치지 않는다는 결론은 위 두 문서 설명에서 이끌어 낸 것이며 문서가 필터 예외 흐름을 이름 붙여 서술하지는 않는다. "필터 안에서 직접 응답을 쓴다"는 처리 방법도 문서가 제시한 것이 아니다.
- (실험 확인) 컨트롤러에서 던진 `IllegalArgumentException`은 `@RestControllerAdvice`가 처리해 400이 되지만, 임베디드 Tomcat 위에서 같은 예외를 필터에서 던지면 어드바이스가 잡지 못해 500이 되고 인터셉터의 `preHandle`이나 컨트롤러에는 도달하지 않는다.
