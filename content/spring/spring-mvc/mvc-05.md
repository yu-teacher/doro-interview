---
slug: "mvc-05"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "`HttpMessageConverter`는 무엇이고 어떻게 동작하나요?"
keywords: ["HttpMessageConverter", "Content-Type", "Accept", "Jackson", "415/406"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"HTTP 본문과 자바 객체 사이를 변환하는 전략 인터페이스입니다. `@RequestBody`가 있으면 요청의 `Content-Type`에 맞는 컨버터가 본문을 객체로 읽고, `@ResponseBody`나 `ResponseEntity`면 `Accept` 헤더와 반환 타입에 맞는 컨버터가 객체를 JSON 같은 형식으로 씁니다. JSON은 보통 Jackson 기반 컨버터가 맡습니다. 맞는 컨버터가 없으면 415나 406 오류가 납니다. `WebMvcConfigurer`로 컨버터를 추가·교체할 수 있습니다."

- (공식 문서) `@ResponseBody` 반환값은 `HttpMessageConverter`로 직렬화되며, MVC Config의 Message Converters 옵션으로 커스터마이즈할 수 있습니다.
- (보충) 415 Unsupported Media Type, 406 Not Acceptable 매핑과 컨버터 선택 세부 알고리즘은 이번에 가져온 문서 페이지에서는 확인하지 않았습니다.
