---
slug: "mvc-19"
topic: "spring-mvc"
tier: TRICKY
difficulty: 3
title: "`@ControllerAdvice`가 여러 개일 때 어떤 것이 먼저 적용되나요?"
keywords: ["@Order", "루트 vs cause 매칭", "advice 우선순위"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html"]
concepts: [global-exception-handling]
importance: 1
links: [{to: "mvc-10", kind: PREREQ}]
---
**모범 답변 (30~60초)**
한 컨트롤러나 한 advice 클래스의 메서드들 사이에서는 루트 예외 매칭이 cause 매칭보다 우선합니다. 하지만 advice 빈들 사이에서는 우선순위가 높은 advice가 이깁니다. 높은 우선순위 advice의 cause 매칭이, 낮은 우선순위 advice의 루트 매칭보다 먼저 선택됩니다. 그래서 문서는 advice가 여러 개일 때 주요 루트 예외 매핑을 우선순위에 맞는 명시적 `@Order`를 준 advice에 두라고 권합니다. 또 Boot의 `spring.mvc.problemdetails.enabled`가 구성하는 핸들러의 order는 0이라, 특정 내장 예외 처리를 가져오려면 그보다 앞서도록 순서를 준 별도 `@ControllerAdvice`를 둬야 합니다.

- (공식 문서, @ExceptionHandler) 루트 예외 매칭을 cause 매칭보다 선호하지만 이는 한 컨트롤러나 `@ControllerAdvice` 클래스의 메서드 사이에서 정의된 것이다. 따라서 우선순위가 높은 `@ControllerAdvice` 빈의 cause 매칭이 우선순위가 낮은 빈의 어떤 매칭(루트 포함)보다도 선호된다. 여러 `@ControllerAdvice`가 있으면 주요 루트 예외 매핑을 해당 order로 우선순위를 준 advice에 선언하라고 권장한다. 예외 매칭 시 `ExceptionDepthComparator`가 던져진 예외 타입으로부터의 깊이로 정렬한다.
- (공식 문서, Error Responses) Boot의 `spring.mvc.problemdetails.enabled`가 자동 구성하는 `ResponseEntityExceptionHandler`의 order는 0이며, 특정 내장 예외를 직접 처리하려면 그보다 앞서 정렬된 핸들러를 둔다.
