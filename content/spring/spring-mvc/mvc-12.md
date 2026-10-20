---
slug: "mvc-12"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`ResponseStatusException`과 `ProblemDetail`(RFC 9457)은 무엇이고 어떻게 쓰나요?"
keywords: ["ProblemDetail", "RFC 9457", "ErrorResponse", "ResponseEntityExceptionHandler", "application/problem+json", "ResponseStatusException"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ProblemDetail.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/server/ResponseStatusException.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/method/annotation/ResponseEntityExceptionHandler.html", "https://docs.spring.io/spring-boot/appendix/application-properties/index.html"]
---
**모범 답변 (30~60초)**
`ProblemDetail`은 RFC 9457 문제 상세의 표현으로, 표준 필드(type, title, status, detail, instance)와 비표준 필드를 담습니다. `@ExceptionHandler`나 컨트롤러 메서드가 `ProblemDetail`이나 `ErrorResponse`를 반환하면 status가 HTTP 상태가 되고 `application/problem+json`으로 응답합니다. 모든 Spring MVC 예외는 `ErrorResponse`를 구현하므로 `ResponseEntityExceptionHandler`를 확장한 `@ControllerAdvice`가 처리하고, Boot는 `spring.mvc.problemdetails.enabled`로 자동 구성합니다. `ResponseStatusException`은 상태 코드와 사유를 받는 하위 클래스입니다.

- (공식 문서, Error Responses) `ProblemDetail`은 스펙이 정의한 표준 필드와 비표준 필드를 담는 단순 컨테이너이고, `ErrorResponse`는 HTTP 상태, 응답 헤더, RFC 9457 형식 본문을 노출하는 계약이며 모든 Spring MVC 예외가 이를 구현한다. `ErrorResponseException`은 기본 구현 클래스이다. `ProblemDetail`/`ErrorResponse` 반환 시 `status`가 HTTP 상태를 정하고, `instance`는 비어 있으면 현재 URL 경로로 설정되며, Jackson JSON·XML 코덱은 각각 `application/problem+json`, `application/problem+xml`을 쓴다.
- (공식 문서) `ResponseEntityExceptionHandler`를 확장해 `@ControllerAdvice`로 선언하면 `ErrorResponse` 예외를 처리하는 `@ExceptionHandler` 메서드가 적용되고, 메서드를 더 추가하거나 protected 메서드로 임의 예외를 `ProblemDetail`로 매핑할 수 있다. 비표준 필드는 `ProblemDetail`의 `properties` 맵에 넣으면 최상위 JSON 속성으로 렌더링된다. 오류 응답의 `type`, `title`, `detail`은 `MessageSource` 코드(`problemDetail.type.<FQCN>`, `problemDetail.title.<FQCN>`, `problemDetail.<FQCN>`)로 커스터마이즈·국제화한다.
- (공식 문서, Boot) `spring.mvc.problemdetails.enabled`는 기본값이 false이며, 켜면 내장 예외를 problem detail로 처리하는 `ResponseEntityExceptionHandler`가 자동 구성된다. 특정 내장 예외를 직접 처리하려면 Boot가 구성한 핸들러(order 0)보다 앞서도록 순서를 지정한 별도 `@ControllerAdvice`를 둔다.
- (공식 문서, Javadoc) `ResponseStatusException`은 "reason"을 받아 기본적으로 `ProblemDetail`의 detail에 매핑하는 `ErrorResponseException`의 하위 클래스이며 `ErrorResponse`를 구현한다. 5.0부터 존재한다.

```java
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    ProblemDetail notFound(NotFoundException e) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
    }
}
```
