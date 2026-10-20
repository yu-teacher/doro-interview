---
slug: "mvc-13"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`@Valid`와 Bean Validation은 컨트롤러에서 어떻게 동작하나요?"
keywords: ["@Valid", "@Validated", "MethodArgumentNotValidException", "HandlerMethodValidationException", "BindingResult", "메서드 검증"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"DTO 필드에 `@NotBlank`, `@Email` 같은 Bean Validation 제약을 달고, 컨트롤러 파라미터에 `@Valid @RequestBody`를 붙이면 바인딩 직후 검증이 수행됩니다. 실패하면 `MethodArgumentNotValidException`이 발생합니다. 파라미터 바로 뒤에 `BindingResult`를 두면 예외 대신 직접 오류를 확인할 수 있습니다. 한편 `@RequestParam`이나 `@PathVariable`에 `@Min` 같은 제약을 직접 달면 메서드 검증이 적용되고, 실패 시 `HandlerMethodValidationException`이 발생합니다. 그래서 두 예외를 모두 처리해야 합니다. 현재 데모의 `MemberRequest`에는 검증 어노테이션이 없어서, 이메일 형식 같은 입력 검증은 서비스에서 직접 하거나 추가가 필요한 부분입니다."

- (공식 문서) `@Valid`는 제약이 아니라 중첩 검증을 전파하는 표시이며, `@NotNull` 같은 제약이 파라미터에 붙으면 메서드 검증이 적용됩니다. `BindingResult`는 검증 대상 인자 바로 뒤에 선언해야 합니다. 컨트롤러 클래스 레벨 `@Validated`(AOP 프록시 방식)는 Spring MVC 내장 메서드 검증(6.1 도입)을 쓰려면 제거하라고 안내합니다. 두 예외는 `ResponseEntityExceptionHandler` 또는 `@ExceptionHandler`로 처리합니다.

```java
public record MemberRequest(@NotBlank String name, @Email @NotBlank String email) {}

@PostMapping
public MemberResponse create(@Valid @RequestBody MemberRequest request) { ... }
```
