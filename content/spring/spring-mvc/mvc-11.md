---
slug: "mvc-11"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "컨트롤러에서 던진 예외는 DispatcherServlet 내부에서 어떤 경로로 처리되나요? (`HandlerExceptionResolver`)"
keywords: ["HandlerExceptionResolver 체인", "ExceptionHandlerExceptionResolver", "ResponseStatusExceptionResolver", "DefaultHandlerExceptionResolver", "컨테이너 에러 페이지"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"DispatcherServlet이 `HandlerExceptionResolver` 빈들의 체인에 예외를 위임합니다. 기본으로 네 종류가 있습니다. `ExceptionHandlerExceptionResolver`가 `@ExceptionHandler`를 호출하고, `ResponseStatusExceptionResolver`는 `@ResponseStatus`가 붙은 예외를 상태 코드로 바꿉니다. `DefaultHandlerExceptionResolver`는 Spring MVC 자체 예외를 표준 상태 코드로 매핑하고, `SimpleMappingExceptionResolver`는 예외를 에러 뷰 이름에 매핑합니다. 어느 리졸버도 처리하지 못하면 Servlet 컨테이너까지 전파되어 기본 에러 페이지나 `/error` 디스패치로 처리됩니다. 그래서 `@ExceptionHandler`는 결국 이 리졸버 체인 위에 만들어진 기능입니다."

- (공식 문서) 위 네 구현체, 반환값(오류 뷰 `ModelAndView` / 빈 `ModelAndView` = 처리됨 / `null` = 다음 리졸버)의 체인 의미, 미처리 시 컨테이너 전파와 ERROR 디스패치 설명이 예외 문서에 있습니다.
