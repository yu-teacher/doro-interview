---
slug: "mvc-22"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "컨트롤러에서 `ResponseEntity`와 `@ResponseStatus`는 언제 각각 쓰나요?"
keywords: ["ResponseEntity", "@ResponseStatus", "상태 코드 제어", "void 반환"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/exceptionhandlers.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ResponseStatus.html"]
---
**모범 답변 (30~60초)**
`ResponseEntity`는 상태 코드, 헤더, 본문 전체를 코드로 지정할 때 쓰고, 조건에 따라 상태 코드나 헤더가 달라지는 경우에 적합합니다. `@ResponseStatus`는 메서드나 예외 클래스에 고정 상태 코드를 선언적으로 지정합니다. `void` 반환에 `@ResponseStatus`가 있으면 응답이 완전히 처리된 것으로 간주되고, 오류용 `@ResponseStatus` 예외는 `ResponseStatusExceptionResolver`가 상태 코드로 매핑합니다. 다만 Javadoc에 따르면 `reason`을 주면 `sendError`가 쓰여 컨테이너가 HTML 에러 페이지를 쓸 수 있어, REST API에서는 `ResponseEntity`를 반환하고 `@ResponseStatus`를 피하라고 합니다.

- (공식 문서, 반환값 표) `HttpEntity`/`ResponseEntity`는 HTTP 헤더와 본문을 포함한 전체 응답을 지정하며 `HttpMessageConverter`로 써진다. `void` 반환(또는 `null`)은 `ServletResponse`나 `OutputStream` 인자가 있거나 `@ResponseStatus`가 있으면 응답을 완전히 처리한 것으로 간주한다. 그 외에는 REST 컨트롤러에서 "응답 본문 없음"을, HTML 컨트롤러에서는 기본 뷰 이름 선택을 뜻할 수 있다.
- (공식 문서, Exceptions) `ResponseStatusExceptionResolver`는 `@ResponseStatus`가 붙은 예외를 어노테이션 값의 HTTP 상태 코드로 매핑한다.
- (공식 문서, Javadoc) `@ResponseStatus`에 `reason`을 설정하면 `HttpServletResponse.sendError`가 쓰이고 이 경우 응답은 완료된 것으로 간주되어 더 쓰면 안 되며 컨테이너가 보통 HTML 에러 페이지를 쓰므로 REST API에는 부적합하다. 그런 경우에는 `ResponseEntity`를 반환 타입으로 쓰고 `@ResponseStatus`를 아예 피하는 것이 낫다. 컨트롤러 클래스에 붙이면 `@RequestMapping`과 `@ExceptionHandler` 메서드가 상속한다(메서드에서 재정의 가능).

```java
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable Long id) { memberService.delete(id); }
```
