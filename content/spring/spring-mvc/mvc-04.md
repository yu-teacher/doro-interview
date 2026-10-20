---
slug: "mvc-04"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "`@PathVariable`, `@RequestParam`, `@RequestBody`는 각각 언제 쓰나요?"
keywords: ["URI 템플릿", "쿼리 파라미터", "요청 본문", "HttpMessageConverter", "타입 변환"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`@PathVariable`은 `/members/{id}` 같은 URI 템플릿 변수를 받고, 리소스 식별에 씁니다. `@RequestParam`은 쿼리스트링이나 폼 파라미터를 받는데, 필터링·페이징 같은 선택 조건에 적합합니다. `@RequestBody`는 HTTP 본문을 `HttpMessageConverter`로 객체에 역직렬화할 때 씁니다. 보통 JSON 요청 본문을 DTO로 받는 용도입니다. 데모의 `MemberController`는 `@PathVariable Long id`와 `@RequestBody MemberRequest request`를 함께 씁니다. 참고로 단순 타입 파라미터는 어노테이션이 없으면 `@RequestParam`으로 취급됩니다."

- (공식 문서) `@PathVariable`은 URI 템플릿 변수, `@RequestParam`은 Servlet 요청 파라미터(타입 변환 적용), `@RequestBody`는 본문을 `HttpMessageConverter`로 변환합니다. 어떤 항목에도 해당하지 않는 인자는 단순 타입이면 `@RequestParam`, 그 외에는 `@ModelAttribute`로 해석됩니다. `Optional`은 `required=false`와 같습니다.

```java
@PutMapping("/{id}")
public MemberResponse update(@PathVariable Long id, @RequestBody MemberRequest request) { ... }

@GetMapping
public List<PostResponse> search(@RequestParam(required = false) String keyword) { ... }
```
