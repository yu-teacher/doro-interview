---
slug: "mvc-22"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "컨트롤러에서 `ResponseEntity`와 `@ResponseStatus`는 언제 각각 쓰나요?"
keywords: ["ResponseEntity", "@ResponseStatus", "상태 코드 제어", "void 반환"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"`ResponseEntity`는 상태 코드, 헤더, 본문을 모두 코드로 제어하고 싶을 때 씁니다. 조건에 따라 상태 코드가 달라지거나 `Location` 같은 헤더를 붙일 때 적합합니다. `@ResponseStatus`는 정적으로 고정된 상태 코드를 선언적으로 지정할 때 쓰며, 데모에서도 생성에 `CREATED`, 삭제에 `NO_CONTENT`를 붙였습니다. `void` 반환이면서 `@ResponseStatus`가 있으면 응답이 완전히 처리된 것으로 간주됩니다. 오류 처리용으로 쓰는 `@ResponseStatus` 예외는 `ResponseStatusExceptionResolver`가 처리합니다."

- (공식 문서) `HttpEntity`/`ResponseEntity`는 전체 응답(상태, 헤더, 본문)을 지정하며, `void` 반환 + `@ResponseStatus`는 처리 완료로 간주됩니다. `ResponseStatusExceptionResolver`는 `@ResponseStatus` 예외를 상태 코드로 매핑합니다.

```java
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable Long id) { memberService.delete(id); }
```
