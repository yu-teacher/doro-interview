---
slug: "mvc-09"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`HandlerInterceptor`의 `preHandle`, `postHandle`, `afterCompletion`은 어떻게 다르며 REST API에서 `postHandle` 사용 시 주의점은?"
keywords: ["preHandle", "postHandle", "afterCompletion", "응답 커밋", "ResponseBodyAdvice"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"`preHandle`은 핸들러 실행 전에 호출되고, `true`를 반환하면 다음으로 진행하고 `false`면 나머지 체인과 핸들러를 건너뜁니다. `postHandle`은 핸들러 실행 직후, `afterCompletion`은 요청이 완전히 끝난 뒤 호출돼서 정리 작업이나 로깅에 씁니다. 주의할 점은 `@ResponseBody`나 `ResponseEntity`를 쓰는 컨트롤러에서는 응답이 `HandlerAdapter` 안에서 이미 쓰이고 커밋되기 때문에 `postHandle`에서 헤더를 추가하는 등 응답을 바꾸기엔 너무 늦다는 것입니다. 그런 경우 `ResponseBodyAdvice`를 쓰라고 문서가 안내합니다."

- (공식 문서) 위 동작과 `ResponseBodyAdvice`(`@ControllerAdvice` 빈 또는 `RequestMappingHandlerAdapter`에 직접 설정) 대안은 모두 인터셉션 문서에 있습니다.
- (실험 확인) 컨트롤러 예외를 `@RestControllerAdvice`가 처리해도 `afterCompletion`은 호출되고(이때 `ex` 인자는 null, 예외가 이미 처리되었기 때문), `postHandle`은 건너뜁니다. 이 부분은 이전에 문서로 확인하지 못해 (보충)으로 두었던 내용인데 `MvcFilterInterceptorTest`로 확인되었습니다.
- (실험 확인) `preHandle`이 `false`를 반환하면 그 인터셉터 자신의 `afterCompletion`은 호출되지 않습니다. 공식 문서에는 이 점이 적혀 있지 않았고 실험으로만 확인했습니다. 앞쪽 인터셉터가 있을 때의 정리 호출 규칙은 따로 검증하지 않았습니다.
