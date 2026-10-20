---
slug: "mvc-10"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`@ExceptionHandler`와 `@ControllerAdvice` / `@RestControllerAdvice`를 설명해 주세요."
keywords: ["@ExceptionHandler", "@ControllerAdvice", "@RestControllerAdvice", "전역 예외 처리", "ExceptionHandlerExceptionResolver"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/exceptionhandlers.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestControllerAdvice.html"]
---
**모범 답변 (30~60초)**
`@ExceptionHandler`는 처리할 예외 타입을 지정해 예외 처리 메서드를 선언하는 어노테이션입니다. 컨트롤러 안에 두면 그 컨트롤러(와 상속 계층)에서 난 예외에만 적용되고, `@ControllerAdvice` 클래스에 두면 모든 컨트롤러에 전역으로 적용됩니다. `@RestControllerAdvice`는 `@ControllerAdvice`에 `@ResponseBody`를 합친 것이라 반환값이 응답 본문으로 직렬화됩니다. 내부적으로는 `ExceptionHandlerExceptionResolver`가 이 메서드들을 호출하고, 전역 핸들러는 컨트롤러의 로컬 핸들러보다 뒤에 적용됩니다. 그래서 컨트롤러는 비즈니스 예외를 던지기만 하고 오류 응답 변환은 advice 한곳에서 관리할 수 있습니다.

- (공식 문서) `@ExceptionHandler`, `@InitBinder`, `@ModelAttribute` 메서드는 선언된 `@Controller` 클래스(와 상속 계층)에만 적용되고, `@ControllerAdvice`나 `@RestControllerAdvice` 클래스에 있으면 모든 컨트롤러에 적용된다. 5.3부터 `@ControllerAdvice`의 `@ExceptionHandler`는 어떤 `@Controller`나 다른 핸들러의 예외도 처리할 수 있다. `@ControllerAdvice`는 `@Component` 메타 어노테이션이라 컴포넌트 스캔으로 등록되고, `@RestControllerAdvice`는 `@ControllerAdvice`와 `@ResponseBody`를 합친 단축 어노테이션이다. 시작 시 `RequestMappingHandlerMapping`과 `ExceptionHandlerExceptionResolver`가 advice 빈을 감지해 적용하며, 전역 `@ExceptionHandler`는 로컬 핸들러 뒤에 적용된다.
- (공식 문서) `annotations`, 패키지, `assignableTypes`로 적용 대상을 좁힐 수 있으나 런타임에 평가되어 과용하면 성능에 불리하다. 예외 매칭은 루트 예외 우선, 그다음 cause이며(5.3부터 임의 깊이) 이 우선순위는 한 컨트롤러나 advice 클래스 안에서만 적용된다. `produces`로 Accept에 따라 JSON/HTML 핸들러를 분리할 수 있고, 핸들러가 예외를 다시 던져 처리를 포기할 수도 있다.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }
}
```
