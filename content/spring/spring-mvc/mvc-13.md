---
slug: "mvc-13"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`@Valid`와 Bean Validation은 컨트롤러에서 어떻게 동작하나요?"
keywords: ["@Valid", "@Validated", "MethodArgumentNotValidException", "HandlerMethodValidationException", "BindingResult", "메서드 검증"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/arguments.html"]
concepts: [request-validation]
importance: 3
links: [{to: "mvc-04", kind: PREREQ}, {to: "mvc-14", kind: FOLLOWUP}, {to: "mvc-12", kind: RELATED}]
---
**모범 답변 (30~60초)**
DTO 필드에 `@NotBlank` 같은 제약을 달고 `@RequestBody`나 `@ModelAttribute` 인자에 `@Valid`(또는 `@Validated`)를 붙이면 그 인자가 검증되고, 실패하면 `MethodArgumentNotValidException`이 발생해 기본적으로 400이 됩니다. 인자 바로 뒤에 `Errors`나 `BindingResult`를 두면 예외 대신 컨트롤러에서 직접 다룹니다. 반면 `@RequestParam`, `@PathVariable` 같은 파라미터에 `@Min` 같은 제약을 직접 달면 메서드 검증이 적용되어 `HandlerMethodValidationException`이 발생합니다. `@Valid`는 중첩 검증 표시라 단독으로는 메서드 검증이 되지 않습니다. 시그니처에 따라 두 예외 중 하나가 나므로 둘 다 처리해야 합니다.

- (공식 문서, Validation) 검증은 두 수준에서 적용된다. `@ModelAttribute`, `@RequestBody`, `@RequestPart` 파라미터에 `@Valid` 또는 Spring의 `@Validated`가 붙으면 그 인자를 개별 검증하고(`Map`/`Collection` 같은 컨테이너는 제외, 바로 뒤에 `Errors`/`BindingResult`가 없고, 메서드 검증이 필요하지 않은 경우) 실패 시 `MethodArgumentNotValidException`이 발생한다. 파라미터나 메서드 반환값에 `@Min`, `@NotBlank` 같은 `@Constraint` 어노테이션이 직접 선언되면 메서드 전체에 검증이 적용되고 이것이 개별 검증을 대체하며 `HandlerMethodValidationException`이 발생한다. 문서는 두 예외 모두 처리하라고 권한다.
- (공식 문서) `@Valid`는 제약 어노테이션이 아니라 객체 내부의 중첩 제약을 위한 것이므로 단독으로는 메서드 검증을 일으키지 않고, `@NotNull`은 제약이라 `@Valid` 파라미터에 붙이면 메서드 검증이 일어난다. 메서드 검증과 `Errors`/`BindingResult` 파라미터를 함께 쓸 수 있지만, 검증 오류가 `Errors`가 바로 뒤에 있는 파라미터에만 있을 때만 컨트롤러가 호출되고 다른 파라미터에 오류가 있으면 `HandlerMethodValidationException`이 발생한다.
- (공식 문서) 컨트롤러에 클래스 수준 `@Validated`가 있으면 메서드 검증이 AOP 프록시로 적용되므로, 6.1에서 추가된 Spring MVC 내장 메서드 검증을 쓰려면 클래스 수준 `@Validated`를 제거해야 한다. 두 예외는 `ResponseEntityExceptionHandler`를 확장하거나 `@ExceptionHandler`로 처리하며, `HandlerMethodValidationException`은 파라미터별 `ParameterValidationResult` 목록을 담는다. `@RequestBody` 문서도 검증 실패 시 `MethodArgumentNotValidException`이 400으로 바뀐다고 한다.

```java
public record MemberRequest(@NotBlank String name, @Email @NotBlank String email) {}

@PostMapping
public MemberResponse create(@Valid @RequestBody MemberRequest request) { ... }
```
