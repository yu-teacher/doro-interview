---
slug: "mvc-21"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "Filter에서 던진 예외도 `@ControllerAdvice`로 잡히나요?"
keywords: ["Filter 예외", "컨테이너 에러 디스패치", "DispatcherServlet 바깥"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"기본적으로 잡히지 않습니다. `@ExceptionHandler`는 `DispatcherServlet`의 `HandlerExceptionResolver` 메커니즘 위에 만들어졌고, Filter는 DispatcherServlet 바깥, 즉 앞단에서 실행되기 때문입니다. 필터의 예외는 Servlet 컨테이너로 전파되어 에러 페이지 디스패치(`/error`)로 처리됩니다. 필터에서 일관된 오류 응답을 주고 싶다면 필터 안에서 직접 응답을 쓰거나, 오류 디스패치를 처리하는 컨트롤러를 두는 식으로 별도 처리해야 합니다."

- (공식 문서) 처리되지 않은 예외는 Servlet 컨테이너로 전파되며 컨테이너가 ERROR 디스패치로 `/error`를 호출할 수 있다는 내용, `@ExceptionHandler`가 `HandlerExceptionResolver` 기반이라는 내용을 근거로 한 추론입니다.
- (보충) "Filter가 DispatcherServlet 앞에 위치한다"는 구조 설명은 일반 지식이며, 필터 예외 흐름을 문서에서 명시적으로 확인한 것은 아닙니다.
- (실험 확인) 컨트롤러에서 던진 `IllegalArgumentException`은 `@RestControllerAdvice`가 처리해 400이 되지만, 같은 예외를 필터에서 던지면 어드바이스가 잡지 못해 500이 되고 `preHandle`이나 컨트롤러에는 도달하지 않습니다. 확인 테스트: `experiment/mvc/MvcRealServerTest`.
