---
slug: "mvc-04"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "`@PathVariable`, `@RequestParam`, `@RequestBody`는 각각 언제 쓰나요?"
keywords: ["URI 템플릿", "쿼리 파라미터", "요청 본문", "HttpMessageConverter", "타입 변환"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/arguments.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html"]
concepts: [mvc-request-flow]
importance: 3
links: [{to: "mvc-05", kind: FOLLOWUP}, {to: "mvc-13", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`@PathVariable`은 `/members/{id}` 같은 URI 템플릿 변수를 받고, 값은 선언한 타입으로 자동 변환됩니다. `@RequestParam`은 쿼리 파라미터나 폼 데이터 같은 Servlet 요청 파라미터를 바인딩하며, 기본은 필수이고 `required=false`나 `Optional`로 선택 사항이 됩니다. `@RequestBody`는 요청 본문을 `HttpMessageConverter`로 읽어 객체로 변환하는 것으로, 보통 JSON 본문을 DTO로 받을 때 씁니다. 어노테이션이 없는 단순 타입 인자는 `@RequestParam`, 그 외 객체는 `@ModelAttribute`로 해석됩니다. 폼 데이터는 `@RequestBody`가 아니라 `@RequestParam`으로 읽어야 합니다.

- (공식 문서) `@PathVariable`의 URI 변수는 적절한 타입으로 자동 변환되며 변환에 실패하면 `TypeMismatchException`이 발생한다. `@RequestParam`은 쿼리 파라미터와 폼 데이터를 바인딩하고 기본은 필수이며, 타입이 `String`이 아니면 타입 변환이 적용되고 배열이나 리스트로 같은 이름의 여러 값을 받을 수 있다. `@RequestBody`는 본문을 `HttpMessageConverter`로 변환한다. 폼 데이터에 `@RequestBody`를 쓰지 말라는 이유는 Servlet API에서 요청 파라미터 접근이 본문을 파싱해 다시 읽을 수 없기 때문이다. 어느 항목에도 해당하지 않는 인자는 단순 타입이면 `@RequestParam`, 그 외에는 `@ModelAttribute`로 해석된다. `Optional`은 `required=false`와 같다.
- (실험 확인) 쿼리 파라미터에 숫자가 아닌 값(`size=abc`)이나 숫자 경로 변수에 문자열을 주면 타입 변환에 실패해 400 응답이 나온다. 생략 가능한 파라미터는 `defaultValue`나 `required=false`로 처리된다.

```java
@PutMapping("/{id}")
public MemberResponse update(@PathVariable Long id, @RequestBody MemberRequest request) { ... }

@GetMapping
public List<PostResponse> search(@RequestParam(required = false) String keyword) { ... }
```
