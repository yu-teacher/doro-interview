---
slug: "mvc-09"
topic: "spring-mvc"
tier: DEEP
difficulty: 2
title: "`HandlerInterceptor`의 `preHandle`, `postHandle`, `afterCompletion`은 어떻게 다르며 REST API에서 `postHandle` 사용 시 주의점은?"
keywords: ["preHandle", "postHandle", "afterCompletion", "응답 커밋", "ResponseBodyAdvice"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-async.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html"]
---
**모범 답변 (30~60초)**
`preHandle`은 핸들러 실행 전에 호출되어 `true`를 반환하면 다음 인터셉터와 핸들러로 진행하고, `false`면 나머지 실행 체인과 핸들러를 건너뜁니다. `postHandle`은 핸들러가 정상 실행된 직후, `afterCompletion`은 요청 처리가 모두 끝난 뒤 호출되어 리소스 정리 같은 일에 씁니다. 둘은 체인의 역순으로 호출되고, `afterCompletion`은 해당 인터셉터의 `preHandle`이 `true`를 반환했을 때만 호출됩니다. REST API에서 주의할 점은 `@ResponseBody`나 `ResponseEntity` 컨트롤러는 응답이 `HandlerAdapter` 안에서 이미 쓰이고 커밋되어서, `postHandle`에서 헤더를 추가하는 식으로 응답을 바꾸기엔 늦다는 것입니다. 이때는 `ResponseBodyAdvice`를 씁니다.

- (공식 문서, Interception) `preHandle`은 핸들러 실행 전 콜백으로 boolean을 반환하며 true면 계속하고 false면 나머지 실행 체인을 건너뛰고 핸들러를 호출하지 않는다. `postHandle`은 핸들러 실행 후, `afterCompletion`은 전체 요청이 끝난 뒤 콜백이다. `@ResponseBody`와 `ResponseEntity` 메서드는 `postHandle` 호출 전에 `HandlerAdapter` 안에서 응답이 쓰이고 커밋되므로 응답 변경은 너무 늦고, `ResponseBodyAdvice`를 구현해 `@ControllerAdvice` 빈으로 선언하거나 `RequestMappingHandlerAdapter`에 직접 설정하라고 안내한다.
- (공식 문서, Javadoc) `postHandle`은 핸들러의 "성공적인 실행 후"의 지점이고 체인의 역순으로 적용된다. `afterCompletion`은 핸들러 실행의 어떤 결과에서도 호출되어 리소스 정리에 쓸 수 있으나, 이 인터셉터의 `preHandle`이 성공적으로 끝나 `true`를 반환한 경우에만 호출되며 역시 체인의 역순이다. 비동기 처리에는 별도 고려가 필요하다.
- (공식 문서, 비동기 요청) `AsyncHandlerInterceptor`는 비동기 처리를 시작하는 최초 요청에서 `postHandle`과 `afterCompletion` 대신 `afterConcurrentHandlingStarted` 콜백을 받는다.
- (실험 확인) 컨트롤러 예외를 `@RestControllerAdvice`가 처리해도 `afterCompletion`은 호출되고(이때 `ex` 인자는 null, 예외가 이미 처리되었기 때문), `postHandle`은 건너뛴다. `preHandle`이 `false`를 반환하면 컨트롤러와 `postHandle`뿐 아니라 그 인터셉터 자신의 `afterCompletion`도 호출되지 않는다. 인터셉터가 여러 개일 때의 정리 호출 순서는 따로 검증하지 않았다.
