---
slug: "mvc-10"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`@ExceptionHandler`와 `@ControllerAdvice` / `@RestControllerAdvice`를 설명해 주세요."
keywords: ["@ExceptionHandler", "@ControllerAdvice", "@RestControllerAdvice", "전역 예외 처리", "ExceptionHandlerExceptionResolver"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`@ExceptionHandler`는 예외 타입을 지정해 그 예외를 처리하는 메서드를 선언하는 어노테이션입니다. 컨트롤러 안에 두면 그 컨트롤러에서 난 예외만 처리하고, `@ControllerAdvice` 클래스에 두면 모든 컨트롤러에 전역으로 적용됩니다. `@RestControllerAdvice`는 `@ControllerAdvice`에 `@ResponseBody`를 합친 것이라 반환값이 응답 본문으로 직렬화됩니다. 데모의 `GlobalExceptionHandler`가 `NotFoundException`은 404, `IllegalArgumentException`은 400으로 변환해 `{message: ...}` 본문을 내려줍니다. 컨트롤러가 비즈니스 예외를 던지기만 하면 오류 응답 변환은 한곳에서 관리됩니다."

- (공식 문서) 컨트롤러 안 `@ExceptionHandler`는 해당 컨트롤러(와 상속 계층)에만 적용되고 `@ControllerAdvice`에 있으면 모든 컨트롤러에 적용됩니다. `@ControllerAdvice`는 `@Component` 메타 어노테이션이라 컴포넌트 스캔으로 등록되고, `@RestControllerAdvice`는 `@ControllerAdvice` + `@ResponseBody`입니다. `annotations`, 패키지, `assignableTypes`로 적용 범위를 좁힐 수 있으나 런타임 평가라 과용하면 성능에 영향이 있다고 경고합니다. 전역 핸들러는 컨트롤러 로컬 핸들러보다 뒤에 실행됩니다.
- (공식 문서) 예외 매칭은 루트 예외 우선, 그다음 cause이며(5.3부터 임의 깊이), 이 우선순위는 한 클래스 안에서만 적용됩니다. 여러 advice 간에는 우선순위가 높은 advice의 cause 매칭이 낮은 advice의 루트 매칭을 이기므로 명시적 `@Order`를 권장합니다. `produces`로 Accept에 따라 JSON/HTML 핸들러를 분리할 수 있습니다.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(NotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }
}
```
