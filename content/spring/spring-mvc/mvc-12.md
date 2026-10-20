---
slug: "mvc-12"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`ResponseStatusException`과 `ProblemDetail`(RFC 9457)은 무엇이고 어떻게 쓰나요?"
keywords: ["ProblemDetail", "RFC 9457", "ErrorResponse", "ResponseEntityExceptionHandler", "application/problem+json", "ResponseStatusException"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"`ProblemDetail`은 RFC 9457 표준의 오류 본문 모델로 type, title, status, detail, instance 같은 표준 필드와 확장 속성을 담습니다. `@ExceptionHandler`나 컨트롤러 메서드에서 `ProblemDetail`이나 `ErrorResponse`를 반환하면 Spring이 상태 코드를 맞추고 `application/problem+json`으로 내려줍니다. 모든 Spring MVC 예외는 `ErrorResponse`를 구현하고, `ResponseEntityExceptionHandler`를 상속한 `@RestControllerAdvice`를 두면 이들을 한꺼번에 처리합니다. Boot에서는 `spring.mvc.problemdetails.enabled`로 이를 자동 구성할 수 있습니다. `ResponseStatusException`은 서비스나 컨트롤러에서 별도 예외 클래스 없이 상태 코드와 사유를 던질 때 편리합니다. 데모의 `{message: ...}` 맵 대신 `ProblemDetail`을 쓰면 표준 형식의 오류 응답이 됩니다."

- (공식 문서) `ProblemDetail`/`ErrorResponse` 반환 시 상태·`instance` 자동 설정과 `application/problem+json`, `ResponseEntityExceptionHandler` 사용법, `spring.mvc.problemdetails.enabled` 및 Boot 핸들러의 order 0, 확장 필드는 `getProperties()`, `MessageSource` 코드(`problemDetail.title.<FQCN>` 등)가 문서에 있습니다.
- (보충) `ResponseStatusException`은 이번에 읽은 문서에 본문이 없었고, `ErrorResponse`를 구현한다는 점은 일반 지식입니다.

```java
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    ProblemDetail notFound(NotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }
}
```
